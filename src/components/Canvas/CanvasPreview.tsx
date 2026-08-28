import React, { useRef, useEffect, useState } from 'react';
import { ProjectState } from '../../types/project';
import { getDeviceFrame, CANVAS_ASPECTS } from '../../models/devices';
import { sampleAnimation, sampleTapFeedback } from '../../services/animationSampler';
import { Upload } from 'lucide-react';

interface CanvasPreviewProps {
  project: ProjectState;
  videoRef: React.RefObject<HTMLVideoElement>;
  onOffsetChange: (offset: { width: number; height: number }) => void;
  onTapPositioned?: (position: { x: number; y: number }) => void;
  onOpenFile: () => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  project,
  videoRef,
  onOpenFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);

  const aspect = CANVAS_ASPECTS[project.canvasAspect];
  const frame = getDeviceFrame(project.deviceModelID, project.deviceColorID);

  // Preload device frame PNG
  useEffect(() => {
    if (frame.kind === 'physical' && frame.imageName) {
      const img = new Image();
      img.src = `./frames/${frame.imageName}`;
      img.onload = () => setFrameImg(img);
    } else {
      setFrameImg(null);
    }
  }, [frame.imageName, frame.kind]);

  // Real-time canvas render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background
      if (project.background.type !== 'none') {
        if (project.background.type === 'solid') {
          ctx.fillStyle = project.background.hex || '#6466FA';
          ctx.fillRect(0, 0, width, height);
        } else if (project.background.type === 'gradient' && project.background.gradient) {
          const grad = project.background.gradient;
          const rad = (grad.angleDegrees * Math.PI) / 180;
          const x1 = width / 2 - Math.cos(rad) * (width / 2);
          const y1 = height / 2 - Math.sin(rad) * (height / 2);
          const x2 = width / 2 + Math.cos(rad) * (width / 2);
          const y2 = height / 2 + Math.sin(rad) * (height / 2);
          const g = ctx.createLinearGradient(x1, y1, x2, y2);
          g.addColorStop(0, grad.startHex);
          g.addColorStop(1, grad.endHex);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, width, height);
        } else if (project.background.type === 'videoBlur' && video && video.readyState >= 2) {
          ctx.save();
          ctx.filter = 'blur(30px) brightness(0.65)';
          ctx.drawImage(video, -30, -30, width + 60, height + 60);
          ctx.restore();
        }
      }

      if (video && video.readyState >= 2) {
        const naturalHeightFraction = 0.9;
        const maxH = height * naturalHeightFraction;
        const maxW = width * naturalHeightFraction;

        let effectiveAspect = frame.frameAspectRatio;
        if (frame.kind === 'none' || frame.kind === 'generic') {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            effectiveAspect = video.videoWidth / video.videoHeight;
          }
        }

        const phoneW = Math.min(maxW, maxH * effectiveAspect);
        const phoneH = effectiveAspect > 0 ? phoneW / effectiveAspect : maxH;

        const sourceTime = video.currentTime;
        const sampled = sampleAnimation(sourceTime, project.animations, project.scale, project.offset);
        const offsetRef = Math.min(width, height);

        ctx.save();
        ctx.translate(
          width / 2 + sampled.offsetX * offsetRef,
          height / 2 + sampled.offsetY * offsetRef
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

        // Shadow
        if (project.shadow.enabled && project.shadow.opacity > 0) {
          ctx.save();
          const opHex = Math.floor(project.shadow.opacity * 255).toString(16).padStart(2, '0');
          ctx.shadowColor = (project.shadow.colorHex || '#000000') + opHex;
          ctx.shadowBlur = project.shadow.radius;
          ctx.shadowOffsetX = project.shadow.offsetX;
          ctx.shadowOffsetY = project.shadow.offsetY;

          ctx.fillStyle = '#000000';
          if (frame.kind === 'physical' && frameImg && frameImg.complete) {
            ctx.drawImage(frameImg, 0, 0, phoneW, phoneH);
          } else {
            drawRoundedRect(ctx, screenX - bezelWidth / 2, screenY - bezelWidth / 2, phoneW + bezelWidth, phoneH + bezelWidth, cornerRadius + bezelWidth / 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Draw Video
        ctx.save();
        ctx.beginPath();
        drawRoundedRect(ctx, screenX, screenY, screenW, screenH, cornerRadius);
        ctx.clip();
        ctx.drawImage(video, screenX, screenY, screenW, screenH);

        // Tap feedback
        drawTapEvents(ctx, screenX, screenY, screenW, screenH, project.tapEvents, sourceTime);
        ctx.restore();

        // Frame overlay
        if (frame.kind === 'physical' && frameImg && frameImg.complete) {
          ctx.drawImage(frameImg, 0, 0, phoneW, phoneH);
        } else if (frame.kind === 'generic' && bezelWidth > 0) {
          ctx.save();
          ctx.strokeStyle = project.bareBezelHex || '#000000';
          ctx.lineWidth = bezelWidth;
          drawRoundedRect(ctx, screenX - bezelWidth / 2, screenY - bezelWidth / 2, screenW + bezelWidth, screenH + bezelWidth, cornerRadius + bezelWidth / 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();

        // Draw Text Overlays
        drawTextOverlays(ctx, width, height, project.overlays, sourceTime);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [project, frame, frameImg]);

  // Dynamic 3D transform style for preview canvas wrapper
  const transform3DStyle: React.CSSProperties = project.transform3D.enabled
    ? {
        transform: `perspective(${project.transform3D.perspective || 1000}px) rotateX(${project.transform3D.rotateX}deg) rotateY(${project.transform3D.rotateY}deg) rotateZ(${project.transform3D.rotateZ}deg)`,
        transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d',
      }
    : {};

  return (
    <div 
      ref={containerRef}
      className="flex-1 h-full bg-dark-950 flex items-center justify-center p-8 relative overflow-hidden select-none"
    >
      {project.videoURL ? (
        <div 
          className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-800/80"
          style={{
            width: aspect.ratio >= 1 ? '580px' : `${580 * aspect.ratio}px`,
            height: aspect.ratio >= 1 ? `${580 / aspect.ratio}px` : '580px',
            maxHeight: 'calc(100vh - 320px)',
            maxWidth: 'calc(100vw - 640px)',
            ...transform3DStyle,
          }}
        >
          <canvas
            ref={canvasRef}
            width={1080}
            height={Math.round(1080 / aspect.ratio)}
            className="w-full h-full object-contain block bg-transparent"
          />
        </div>
      ) : (
        <div 
          onClick={onOpenFile}
          className="flex flex-col items-center justify-center space-y-4 p-12 rounded-3xl border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-dark-900/40 hover:bg-dark-900/60 transition cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-brand-500/10">
            <Upload className="w-8 h-8 text-brand-400" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-slate-200 text-sm">Drop a screen recording here</h3>
            <p className="text-xs text-slate-400">MP4, MOV, WebM recordings supported</p>
          </div>
        </div>
      )}
    </div>
  );
};

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
      ctx.beginPath();
      ctx.arc(0, 0, (diameter / 2) * sample.ringScale, 0, Math.PI * 2);
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = sample.ringOpacity;
      ctx.lineWidth = Math.max(2, diameter * 0.055);
      ctx.stroke();

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

function drawTextOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  overlays: any[],
  sourceTime: number
) {
  if (!overlays) return;

  for (const o of overlays) {
    if (sourceTime < o.startTime || sourceTime > o.startTime + o.duration) continue;

    const x = o.position.x * width;
    const y = o.position.y * height;
    const padding = 16;

    ctx.save();
    ctx.font = `600 ${o.fontSize || 24}px Inter, sans-serif`;
    const textWidth = ctx.measureText(o.text).width;
    const cardW = textWidth + padding * 2.5;
    const cardH = (o.fontSize || 24) + padding * 1.5;

    // Draw pill card
    ctx.save();
    ctx.translate(x - cardW / 2, y - cardH / 2);

    if (o.style === 'frosted') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    } else if (o.style === 'neon') {
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#6466fa';
      ctx.shadowColor = '#6466fa';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = o.bgColor || '#6466FA';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    }

    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 0, 0, cardW, cardH, cardH / 2);
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = o.textColor || '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(o.text, cardW / 2, cardH / 2);

    ctx.restore();
    ctx.restore();
  }
}
