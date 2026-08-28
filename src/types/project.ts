import { 
  BackgroundOption, 
  CanvasAspectRatioType, 
  PhoneShadow, 
  Device3DTransform,
  AudioTrack,
  ZoomSegment, 
  TapEvent, 
  SpeedSegment, 
  TextOverlay,
  SelectedEvent 
} from './models';

export interface ProjectState {
  videoURL: string | null;
  displayName: string | null;
  videoNaturalWidth: number;
  videoNaturalHeight: number;
  videoDuration: number;
  currentSeconds: number;
  isPlaying: boolean;
  isMuted: boolean;

  scale: number;
  offset: { width: number; height: number };
  background: BackgroundOption;
  canvasAspect: CanvasAspectRatioType;
  shadow: PhoneShadow;
  transform3D: Device3DTransform;

  deviceModelID: string;
  deviceColorID: string;

  bareCornerRadius: number;
  bareBezelWidth: number;
  bareBezelHex: string;

  animations: ZoomSegment[];
  tapEvents: TapEvent[];
  speedSegments: SpeedSegment[];
  overlays: TextOverlay[];
  audioTracks: AudioTrack[];
  selectedEvent: SelectedEvent;

  trimStartTime: number;
  trimEndTime: number;
  clipTimelineStart: number;

  isExporting: boolean;
  exportProgress: number;
  exportType: 'background' | 'transparent' | null;
}
