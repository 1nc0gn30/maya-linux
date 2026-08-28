import { ProjectState } from '../types/project';
import { getDeviceFrame, CANVAS_ASPECTS } from '../models/devices';
import { SpeedTimeline } from '../models/speedTimeline';
import { sampleAnimation, sampleTapFeedback } from './animationSampler';

export interface ExportOptions {
  transparent: boolean;
  onProgress: (progress: number) => void;
}

export async function exportVideo(
  project: ProjectState,
  options: ExportOptions,
  videoElement: HTMLVideoElement
): Promise<Blob> {
  const aspectConfig = CANVAS_ASPECTS[project.canvasAspect];
  const targetWidth = aspectConfig.renderWidth;
  const targetHeight = aspectConfig.renderHeight;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Could not create Canvas2D rendering context');

  // Pre-load frame overlay image if physical
  const frame = getDeviceFrame(project.deviceModelID, project.deviceColorID);
  let frameImage: HTMLImageElement | null = null;
  if (frame.kind === 'physical' && frame.imageName) {
    frameImage = await loadImage(`./frames/${frame.imageName}`);
  }

  let bgImage: HTMLImageElement | null = null;
  if (project.background.type === 'image' && project.background.imageURL) {
    bgImage = await loadImage(project.background.imageURL);
  }

  const speedTimeline = new SpeedTimeline(
    project.trimStartTime,
    project.trimEndTime,
    project.speedSegments
  );

  const totalDuration = speedTimeline.duration;
  const fps = 60;
  const totalFrames = Math.max(1, Math.floor(totalDuration * fps));

  // Use Web MediaRecorder or Canvas capture stream
  const mimeType = options.transparent 
    ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9' : 'video/webm')
    : (MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm;codecs=vp9');

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 25_000_000, // 25 Mbps high fidelity
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start();

  // Save current video time state
  const prevTime = videoElement.currentTime;
  const prevMuted = videoElement.muted;
  videoElement.muted = true;

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const timelineTime = (frameIndex / totalFrames) * totalDuration;
    const sourceTime = speedTimeline.sourceTime(timelineTime);

    await seekVideoTo(videoElement, sourceTime);

    // Render exact frame to canvas
    renderCompositeFrame({
      ctx,
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      video: videoElement,
      project,
      frame,
      frameImage,
      bgImage,
      sourceTime,
      transparent: options.transparent,
    });

    options.onProgress((frameIndex + 1) / totalFrames);
    await new Promise(r => setTimeout(r, 8)); // allow recorder stream flush
  }

  recorder.stop();
  videoElement.currentTime = prevTime;
  videoElement.muted = prevMuted;

  return await recordingPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img); // resolve gracefully if placeholder
    img.src = src;
  });
}

function seekVideoTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.01) {
      resolve();
      return;
    }
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

interface FrameRenderContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  video: HTMLVideoElement;
  project: ProjectState;
  frame: any;
  frameImage: HTMLImageElement | null;
  bgImage: HTMLImageElement | null;
  sourceTime: number;
  transparent: boolean;
}

function renderCompositeFrame(rc: FrameRenderContext) {
  const { ctx, canvasWidth, canvasHeight, video, project, frame, frameImage, bgImage, sourceTime, transparent } = rc;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Draw Background (if not transparent)
  if (!transparent && project.background.type !== 'none') {
    drawBackground(ctx, canvasWidth, canvasHeight, project.background, bgImage, video);
  }

  // 2. Geometry calculations
  const naturalHeightFraction = 0.9;
  const maxH = canvasHeight * naturalHeightFraction;
  const maxW = canvasWidth * naturalHeightFraction;

  let effectiveAspect = frame.frameAspectRatio;
  if (frame.kind === 'none' || frame.kind === 'generic') {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      effectiveAspect = video.videoWidth / video.videoHeight;
    }
  }

  const phoneW = Math.min(maxW, maxH * effectiveAspect);
  const phoneH = effectiveAspect > 0 ? phoneW / effectiveAspect : maxH;

  const sampled = sampleAnimation(sourceTime, project.animations, project.scale, project.offset);
  const offsetRef = Math.min(canvasWidth, canvasHeight);

  ctx.save();
  // Translate to center + animated offset
  ctx.translate(
    canvasWidth / 2 + sampled.offsetX * offsetRef,
    canvasHeight / 2 + sampled.offsetY * offsetRef
  );
  ctx.scale(sampled.scale, sampled.scale);
  ctx.translate(-phoneW / 2, -phoneH / 2);

  const screenX = frame.screenRectNormalized.x * phoneW;
  const screenY = frame.screenRectNormalized.y * phoneH;
  const screenW = frame.screenRectNormalized.width * phoneW;
  const screenH = frame.screenRectNormalized.height * phoneH;

  let cornerRadius = frame.screenCornerRadiusNormalized * phoneW;
  if (frame.kind === 'none' || frame.kind === 'generic') {
    cornerRadius = project.bareCornerRadius * Math.min(screenW, screenH);
  }

  const bezelWidth = frame.kind === 'generic' ? Math.max(0, phoneW * project.bareBezelWidth) : 0;

  // 3. Drop Shadow
  if (project.shadow.enabled && project.shadow.opacity > 0) {
    ctx.save();
    ctx.shadowColor = project.shadow.colorHex + Math.floor(project.shadow.opacity * 255).toString(16).padStart(2, '0');
    ctx.shadowBlur = project.shadow.radius * (canvasWidth / 500);
    ctx.shadowOffsetX = project.shadow.offsetX * (canvasWidth / 500);
    ctx.shadowOffsetY = project.shadow.offsetY * (canvasWidth / 500);

    ctx.fillStyle = '#000000';
    if (frame.kind === 'physical' && frameImage && frameImage.complete && frameImage.naturalWidth > 0) {
      ctx.drawImage(frameImage, 0, 0, phoneW, phoneH);
    } else {
      drawRoundedRect(ctx, screenX - bezelWidth / 2, screenY - bezelWidth / 2, phoneW + bezelWidth, phoneH + bezelWidth, cornerRadius + bezelWidth / 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Draw Video (clipped to rounded screen rect)
  ctx.save();
  ctx.beginPath();
  drawRoundedRect(ctx, screenX, screenY, screenW, screenH, cornerRadius);
  ctx.clip();
  ctx.drawImage(video, screenX, screenY, screenW, screenH);

  // 5. Draw Tap feedback on top of video inside screen rect
  drawTapEvents(ctx, screenX, screenY, screenW, screenH, project.tapEvents, sourceTime);
  ctx.restore();

  // 6. Draw Frame Overlay
  if (frame.kind === 'physical' && frameImage && frameImage.complete && frameImage.naturalWidth > 0) {
    ctx.drawImage(frameImage, 0, 0, phoneW, phoneH);
  } else if (frame.kind === 'generic' && bezelWidth > 0) {
    ctx.save();
    ctx.strokeStyle = project.bareBezelHex || '#000000';
    ctx.lineWidth = bezelWidth;
    drawRoundedRect(ctx, screenX - bezelWidth / 2, screenY - bezelWidth / 2, screenW + bezelWidth, screenH + bezelWidth, cornerRadius + bezelWidth / 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg: any,
  bgImage: HTMLImageElement | null,
  video: HTMLVideoElement
) {
  if (bg.type === 'solid') {
    ctx.fillStyle = bg.hex || '#6466FA';
    ctx.fillRect(0, 0, width, height);
  } else if (bg.type === 'gradient' && bg.gradient) {
    const angleRad = (bg.gradient.angleDegrees * Math.PI) / 180;
    const x1 = width / 2 - Math.cos(angleRad) * (width / 2);
    const y1 = height / 2 - Math.sin(angleRad) * (height / 2);
    const x2 = width / 2 + Math.cos(angleRad) * (width / 2);
    const y2 = height / 2 + Math.sin(angleRad) * (height / 2);

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, bg.gradient.startHex);
    grad.addColorStop(1, bg.gradient.endHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (bg.type === 'image' && bgImage && bgImage.complete) {
    ctx.drawImage(bgImage, 0, 0, width, height);
  } else if (bg.type === 'videoBlur') {
    ctx.save();
    ctx.filter = 'blur(40px) brightness(0.7)';
    ctx.drawImage(video, -40, -40, width + 80, height + 80);
    ctx.restore();
  }
}

function drawTapEvents(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  screenW: number,
  screenH: number,
  tapEvents: any[],
  sourceTime: number
) {
  const shortSide = Math.min(screenW, screenH);

  for (const ev of tapEvents) {
    const sample = sampleTapFeedback(sourceTime, ev);
    if (!sample) continue;

    const posX = screenX + ev.position.x * screenW;
    const posY = screenY + ev.position.y * screenH;
    const diameter = shortSide * ev.diameterFraction;
    const colorHex = ev.colorHex || '#6466FA';

    ctx.save();
    ctx.translate(posX, posY);

    if (ev.style === 'ripple') {
      // Ring
      ctx.beginPath();
      ctx.arc(0, 0, (diameter / 2) * sample.ringScale, 0, Math.PI * 2);
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = sample.ringOpacity;
      ctx.lineWidth = Math.max(2, diameter * 0.055);
      ctx.stroke();

      // Core
      ctx.beginPath();
      ctx.arc(0, 0, (diameter * 0.11) * sample.coreScale, 0, Math.PI * 2);
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = sample.coreOpacity;
      ctx.fill();
    } else if (ev.style === 'pulse') {
      ctx.beginPath();
      ctx.arc(0, 0, (diameter * 0.29) * sample.coreScale, 0, Math.PI * 2);
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = sample.coreOpacity * 0.82;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, (diameter / 2) * sample.ringScale, 0, Math.PI * 2);
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = sample.ringOpacity * 0.42;
      ctx.lineWidth = Math.max(2, diameter * 0.035);
      ctx.stroke();
    } else if (ev.style === 'ring') {
      ctx.beginPath();
      ctx.arc(0, 0, (diameter / 2) * sample.ringScale, 0, Math.PI * 2);
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = sample.ringOpacity;
      ctx.lineWidth = Math.max(2, diameter * 0.07);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
