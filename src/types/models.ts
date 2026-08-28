export type DeviceFrameKind = 'physical' | 'generic' | 'none';

export interface DeviceColor {
  id: string;
  name: string;
  imageName: string;
  swatchHex: string;
}

export interface RectNormalized {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DeviceModel {
  id: string;
  displayName: string;
  frameAspectRatio: number;
  screenRectNormalized: RectNormalized;
  screenCornerRadiusNormalized: number;
  colors: DeviceColor[];
  kind: DeviceFrameKind;
  symbol: string;
  defaultColor: DeviceColor;
}

export interface DeviceFrame {
  id: string;
  displayName: string;
  imageName: string;
  frameAspectRatio: number;
  screenRectNormalized: RectNormalized;
  screenCornerRadiusNormalized: number;
  kind: DeviceFrameKind;
}

export type CanvasAspectRatioType = 'square' | 'vertical9x16' | 'vertical4x5' | 'landscape4x3' | 'landscape16x9';

export interface CanvasAspectConfig {
  id: CanvasAspectRatioType;
  ratio: number;
  displayName: string;
  shortLabel: string;
  renderWidth: number;
  renderHeight: number;
  symbol: string;
}

export interface GradientSpec {
  startHex: string;
  endHex: string;
  angleDegrees: number;
}

export type BackgroundType = 'none' | 'solid' | 'gradient' | 'image' | 'videoBlur';

export interface BackgroundOption {
  type: BackgroundType;
  hex?: string;
  gradient?: GradientSpec;
  imageURL?: string;
}

export interface PhoneShadow {
  enabled: boolean;
  colorHex: string;
  radius: number;
  offsetY: number;
  offsetX: number;
  opacity: number;
}

export interface Device3DTransform {
  enabled: boolean;
  rotateX: number; // Pitch (-45 to 45 deg)
  rotateY: number; // Yaw (-45 to 45 deg)
  rotateZ: number; // Roll (-45 to 45 deg)
  perspective: number; // 800 to 2500
  autoDrift: boolean; // Subtle cinematic parallax drift
}

export interface AudioTrack {
  id: string;
  url: string;
  name: string;
  volume: number; // 0..1
  startTime: number; // timeline start in seconds
  duration: number;
  isMuted: boolean;
}

export type ZoomFocus = 'top' | 'center' | 'bottom';
export type AnimationCurve = 'spring' | 'bouncy' | 'smooth' | 'snappy' | 'gentle' | 'linear';

export interface ZoomSegment {
  id: string;
  startTime: number;
  duration: number;
  scale: number;
  focus: ZoomFocus;
  transitionIn: number;
  transitionOut: number;
  curve: AnimationCurve;
}

export type TapStyle = 'ripple' | 'pulse' | 'ring';

export interface TapEvent {
  id: string;
  startTime: number;
  duration: number;
  position: { x: number; y: number }; // normalized 0..1 inside screen
  style: TapStyle;
  diameterFraction: number; // normalized relative to screen short side
  colorHex: string;
  playSound: boolean;
}

export interface SpeedSegment {
  id: string;
  startTime: number;
  duration: number;
  rate: number;
}

export type BadgeStyle = 'pill' | 'frosted' | 'neon' | 'minimal';

export interface TextOverlay {
  id: string;
  startTime: number;
  duration: number;
  text: string;
  subtitle?: string;
  position: { x: number; y: number }; // normalized 0..1 on canvas
  style: BadgeStyle;
  bgColor: string;
  textColor: string;
  fontSize: number; // 12 to 36
}

export type SelectedEvent = 
  | { type: 'zoom'; id: string }
  | { type: 'tap'; id: string }
  | { type: 'speed'; id: string }
  | { type: 'overlay'; id: string }
  | { type: 'audio'; id: string }
  | null;
