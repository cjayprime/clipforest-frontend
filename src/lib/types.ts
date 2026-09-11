export type VideoStatus =
  | 'CREATED'
  | 'UPLOADING'
  | 'QUEUED'
  | 'INGESTING'
  | 'TRANSCRIBING'
  | 'ANALYZING'
  | 'READY'
  | 'FAILED';

export type RenderStatus = 'QUEUED' | 'PREPARING' | 'ANALYZING_VISUALS' | 'RENDERING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export type CaptionPreset = 'bold-default' | 'karaoke' | 'minimal' | 'impact';
export type FramingMode = 'auto' | 'center' | 'fit';

export interface ApiErrorBody {
  code: string;
  message: string;
  retryable: boolean;
  correlationId: string | null;
  details?: unknown;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  plan: string;
  createdAt: string;
  usage: { transcribedMinutes: number; renderedSeconds: number };
}

export interface Video {
  id: string;
  title: string;
  originalFilename: string;
  sourceType: 'upload' | 'url';
  sourceUrl: string | null;
  sourceProvider: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  orientation: string | null;
  hasAudio: boolean | null;
  videoCodec: string | null;
  audioCodec: string | null;
  language: string | null;
  status: VideoStatus;
  progress: number;
  stage: string | null;
  substage: string | null;
  failedStage: string | null;
  pipelineVersion: string;
  error: ApiErrorBody | null;
  hasTranscript: boolean;
  sourceAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  readyAt: string | null;
  thumbnailUrl?: string | null;
  candidateCount?: number;
  topScore?: number | null;
  renderCount?: number;
}

export interface ComponentScores {
  hook: number;
  clarity: number;
  novelty: number;
  emotion: number;
  completeness: number;
  shareability: number;
}

export interface Candidate {
  id: string;
  videoId: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  title: string;
  hookText: string;
  excerpt: string;
  summary: string;
  reason: string;
  category: string;
  score: number;
  componentScores: ComponentScores;
  rank: number;
  latestRender: { id: string; status: RenderStatus; progress: number; version: number } | null;
}

export interface CandidateList {
  videoStatus: VideoStatus;
  analysisRun: number;
  minScore: number;
  defaultMinScore: number;
  total: number;
  hiddenCount: number;
  items: Candidate[];
}

export interface RenderSettings {
  aspectRatio: '9:16';
  framingMode: FramingMode;
  captions: { enabled: boolean; preset: CaptionPreset };
  output: { width: number; height: number };
}

export interface Render {
  id: string;
  videoId: string;
  candidateId: string | null;
  parentRenderId: string | null;
  lineageKey: string;
  version: number;
  isLatest: boolean;
  title: string;
  startMs: number;
  endMs: number;
  settings: RenderSettings;
  status: RenderStatus;
  progress: number;
  stage: string | null;
  substage: string | null;
  attempt: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  fileSize: number | null;
  framing: { strategy?: string; reason?: string; faceCoverage?: number; [k: string]: unknown } | null;
  error: ApiErrorBody | null;
  createdAt: string;
  completedAt: string | null;
  outputUrl?: string | null;
  downloadUrl?: string | null;
  thumbnailUrl?: string | null;
  urlsExpireAt?: string | null;
  videoTitle?: string;
  deduplicated?: boolean;
  video?: { id: string; title: string; durationMs: number | null; width: number | null; height: number | null; status: VideoStatus } | null;
  candidate?: { id: string; title: string; score: number; startMs: number; endMs: number; reason: string; category: string } | null;
  versions?: { id: string; version: number; status: RenderStatus; isLatest: boolean; createdAt: string; startMs: number; endMs: number; settings: RenderSettings }[];
}

export interface Playback {
  sourceUrl: string | null;
  isProxy: boolean;
  thumbnailUrl: string | null;
  expiresAt: string;
}

export interface TranscriptRange {
  language: string | null;
  provider: string;
  startMs: number;
  endMs: number;
  segments: { id: string; startMs: number; endMs: number; text: string; speaker?: string }[];
  words: { startMs: number; endMs: number; text: string; speaker?: string }[];
}

export interface AppConfig {
  maxUploadBytes: number;
  maxVideoDurationSec: number;
  acceptedExtensions: string[];
  sourceHosts: string[];
  captionPresets: CaptionPreset[];
  framingModes: FramingMode[];
  aspectRatios: string[];
  minCandidateScore: number;
  renderMinDurationMs: number;
  renderMaxDurationMs: number;
  pipelineVersion: string;
}

export interface ProgressEvent {
  type: 'video.updated' | 'render.updated';
  userId: string;
  videoId?: string;
  renderId?: string;
  status: string;
  progress?: number;
  stage?: string | null;
  substage?: string | null;
  errorCode?: string | null;
  at: string;
}
