import { DeviceModel, DeviceFrame, CanvasAspectConfig, CanvasAspectRatioType, GradientSpec } from '../types/models';

const pro16_17Geometry = {
  aspect: 450.0 / 920.0,
  screenRect: {
    x: 24.0 / 450.0,
    y: 23.0 / 920.0,
    width: 402.0 / 450.0,
    height: 874.0 / 920.0,
  },
  cornerRadius: 60.0 / 450.0,
};

const pro15Geometry = {
  aspect: 473.0 / 932.0,
  screenRect: {
    x: 40.0 / 473.0,
    y: 40.0 / 932.0,
    width: 393.0 / 473.0,
    height: 852.0 / 932.0,
  },
  cornerRadius: 60.0 / 473.0,
};

const voidColor = {
  id: 'default',
  name: 'Default',
  imageName: '',
  swatchHex: '#000000',
};

export const DEVICE_MODELS: DeviceModel[] = [
  {
    id: 'no-frame',
    displayName: 'No frame',
    frameAspectRatio: 9.0 / 19.5,
    screenRectNormalized: { x: 0, y: 0, width: 1, height: 1 },
    screenCornerRadiusNormalized: 0.04,
    colors: [voidColor],
    kind: 'none',
    symbol: 'rectangle.dashed',
    defaultColor: voidColor,
  },
  {
    id: 'generic-phone',
    displayName: 'Generic',
    frameAspectRatio: 9.0 / 19.5,
    screenRectNormalized: { x: 0, y: 0, width: 1, height: 1 },
    screenCornerRadiusNormalized: 0.06,
    colors: [voidColor],
    kind: 'generic',
    symbol: 'iphone',
    defaultColor: voidColor,
  },
  {
    id: 'iphone-17-pro',
    displayName: 'iPhone 17 Pro',
    frameAspectRatio: pro16_17Geometry.aspect,
    screenRectNormalized: pro16_17Geometry.screenRect,
    screenCornerRadiusNormalized: pro16_17Geometry.cornerRadius,
    colors: [
      { id: 'cosmic-orange', name: 'Cosmic Orange', imageName: 'iPhone 17 Pro - Cosmic Orange.png', swatchHex: '#E96A2C' },
      { id: 'deep-blue', name: 'Deep Blue', imageName: 'iPhone 17 Pro - Deep Blue.png', swatchHex: '#3F5476' },
      { id: 'silver', name: 'Silver', imageName: 'iPhone 17 Pro - Silver.png', swatchHex: '#C9CCD0' },
    ],
    kind: 'physical',
    symbol: 'iphone',
    defaultColor: { id: 'cosmic-orange', name: 'Cosmic Orange', imageName: 'iPhone 17 Pro - Cosmic Orange.png', swatchHex: '#E96A2C' },
  },
  {
    id: 'iphone-16-pro',
    displayName: 'iPhone 16 Pro',
    frameAspectRatio: pro16_17Geometry.aspect,
    screenRectNormalized: pro16_17Geometry.screenRect,
    screenCornerRadiusNormalized: pro16_17Geometry.cornerRadius,
    colors: [
      { id: 'natural-titanium', name: 'Natural Titanium', imageName: 'iPhone 16 Pro - Natural Titanium .png', swatchHex: '#BFB4A1' },
      { id: 'black-titanium', name: 'Black Titanium', imageName: 'iPhone 16 Pro - Black Titanium.png', swatchHex: '#3A3A3C' },
      { id: 'white-titanium', name: 'White Titanium', imageName: 'iPhone 16 Pro - White Titanium.png', swatchHex: '#E3E0DA' },
      { id: 'gold-titanium', name: 'Desert Titanium', imageName: 'iPhone 16 Pro - Gold Titanium.png', swatchHex: '#C9A77F' },
    ],
    kind: 'physical',
    symbol: 'iphone',
    defaultColor: { id: 'natural-titanium', name: 'Natural Titanium', imageName: 'iPhone 16 Pro - Natural Titanium .png', swatchHex: '#BFB4A1' },
  },
  {
    id: 'iphone-15-pro',
    displayName: 'iPhone 15 Pro',
    frameAspectRatio: pro15Geometry.aspect,
    screenRectNormalized: pro15Geometry.screenRect,
    screenCornerRadiusNormalized: pro15Geometry.cornerRadius,
    colors: [
      { id: 'natural-titanium', name: 'Natural Titanium', imageName: 'iPhone 15 Pro - Natural Titanium.png', swatchHex: '#8B8378' },
      { id: 'black-titanium', name: 'Black Titanium', imageName: 'iPhone 15 Pro - Black Titanium.png', swatchHex: '#3A3A3C' },
      { id: 'white-titanium', name: 'White Titanium', imageName: 'iPhone 15 Pro - White Titanium.png', swatchHex: '#E3E0DA' },
    ],
    kind: 'physical',
    symbol: 'iphone',
    defaultColor: { id: 'natural-titanium', name: 'Natural Titanium', imageName: 'iPhone 15 Pro - Natural Titanium.png', swatchHex: '#8B8378' },
  },
  {
    id: 'ipad-pro-11',
    displayName: 'iPad Pro 11"',
    frameAspectRatio: 1320.0 / 940.0,
    screenRectNormalized: {
      x: 52.0 / 1320.0,
      y: 50.0 / 940.0,
      width: 1216.0 / 1320.0,
      height: 840.0 / 940.0,
    },
    screenCornerRadiusNormalized: 35.0 / 1320.0,
    colors: [
      { id: 'silver', name: 'Silver', imageName: 'iPad Pro 11.png', swatchHex: '#C9CCD0' },
    ],
    kind: 'physical',
    symbol: 'ipad.landscape',
    defaultColor: { id: 'silver', name: 'Silver', imageName: 'iPad Pro 11.png', swatchHex: '#C9CCD0' },
  },
  {
    id: 'macbook-pro-14',
    displayName: 'MacBook Pro 14"',
    frameAspectRatio: 1216.0 / 735.0,
    screenRectNormalized: {
      x: 122.0 / 1216.0,
      y: 15.0 / 735.0,
      width: 972.0 / 1216.0,
      height: 634.0 / 735.0,
    },
    screenCornerRadiusNormalized: 10.0 / 1216.0,
    colors: [
      { id: 'silver', name: 'Silver', imageName: 'MacBook Pro 14.png', swatchHex: '#C9CCD0' },
    ],
    kind: 'physical',
    symbol: 'laptopcomputer',
    defaultColor: { id: 'silver', name: 'Silver', imageName: 'MacBook Pro 14.png', swatchHex: '#C9CCD0' },
  },
];

export function getDeviceFrame(modelId: string, colorId?: string): DeviceFrame {
  const model = DEVICE_MODELS.find(m => m.id === modelId) || DEVICE_MODELS[2];
  const color = model.colors.find(c => c.id === colorId) || model.defaultColor;

  return {
    id: `${model.id}.${color.id}`,
    displayName: model.kind === 'physical' ? `${model.displayName} – ${color.name}` : model.displayName,
    imageName: color.imageName,
    frameAspectRatio: model.frameAspectRatio,
    screenRectNormalized: model.screenRectNormalized,
    screenCornerRadiusNormalized: model.screenCornerRadiusNormalized,
    kind: model.kind,
  };
}

export const CANVAS_ASPECTS: Record<CanvasAspectRatioType, CanvasAspectConfig> = {
  square: {
    id: 'square',
    ratio: 1.0,
    displayName: 'Square',
    shortLabel: '1:1',
    renderWidth: 1080,
    renderHeight: 1080,
    symbol: 'square',
  },
  vertical9x16: {
    id: 'vertical9x16',
    ratio: 9.0 / 16.0,
    displayName: 'Reels / Story',
    shortLabel: '9:16',
    renderWidth: 1080,
    renderHeight: 1920,
    symbol: 'rectangle.portrait',
  },
  vertical4x5: {
    id: 'vertical4x5',
    ratio: 4.0 / 5.0,
    displayName: 'Portrait',
    shortLabel: '4:5',
    renderWidth: 1080,
    renderHeight: 1350,
    symbol: 'rectangle.portrait',
  },
  landscape4x3: {
    id: 'landscape4x3',
    ratio: 4.0 / 3.0,
    displayName: 'Landscape',
    shortLabel: '4:3',
    renderWidth: 1440,
    renderHeight: 1080,
    symbol: 'rectangle',
  },
  landscape16x9: {
    id: 'landscape16x9',
    ratio: 16.0 / 9.0,
    displayName: 'YouTube / Widescreen',
    shortLabel: '16:9',
    renderWidth: 1920,
    renderHeight: 1080,
    symbol: 'rectangle',
  },
};

export const GRADIENT_PRESETS: GradientSpec[] = [
  { startHex: '#6466FA', endHex: '#A78BFA', angleDegrees: 135 },
  { startHex: '#6466FA', endHex: '#EC4899', angleDegrees: 135 },
  { startHex: '#6466FA', endHex: '#22D3EE', angleDegrees: 135 },
  { startHex: '#818CF8', endHex: '#F59E0B', angleDegrees: 135 },
  { startHex: '#1E1B4B', endHex: '#6466FA', angleDegrees: 180 },
  { startHex: '#4338CA', endHex: '#0F172A', angleDegrees: 135 },
  { startHex: '#E0E7FF', endHex: '#818CF8', angleDegrees: 135 },
  { startHex: '#A5B4FC', endHex: '#C084FC', angleDegrees: 135 },
];

export const SOLID_PRESETS = [
  '#6466FA',
  '#4338CA',
  '#A78BFA',
  '#1E1B4B',
  '#0F172A',
  '#000000',
  '#FFFFFF',
  '#F8FAFC',
  '#E0E7FF',
];
