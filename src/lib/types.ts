/** Response shapes of the ClipRover API. */



/** The error envelope every failed API response carries (PRD §12.3). */
export interface ApiErrorBody {
  code: string;
  message: string;
  retryable: boolean;
  correlationId: string | null;
  details?: unknown;
}

/** Server-owned limits and vocabularies, so the UI never hardcodes them. */
export interface AppConfig {
  maxUploadBytes: number;
  maxVideoDurationSec: number;
  acceptedExtensions: string[];
  sourceHosts: string[];
  captionPresets: CaptionPreset[];
  framingModes: FramingMode[];
  aspectRatios: AspectRatio[];
  minCandidateScore: number;
  renderMinDurationMs: number;
  renderMaxDurationMs: number;
  pipelineVersion: string;
  /** False until a Polar access token is configured; checkout is unavailable. */
  billingEnabled: boolean;
  /** Fraction of a monthly allowance that carries into the next period (0–1). */
  creditRolloverShare: number;
  /** Intervals every paid plan can be checked out on; empty until products are configured. */
  billingIntervals: BillingInterval[];
  creditCosts: CreditCosts;
}

/** How a plan is billed. Both intervals grant the same credits every month. */
export type BillingInterval = 'month' | 'year';

/** Moments below `minScore` are counted in `hiddenCount`, never silently dropped. */
export interface CandidateList {
  videoStatus: VideoStatus;
  analysisRun: number;
  minScore: number;
  defaultMinScore: number;
  total: number;
  hiddenCount: number;
  items: Candidate[];
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

export type CaptionPreset = 'bold-default' | 'karaoke' | 'minimal' | 'impact';

/** Whether the paid order from a Polar checkout has been turned into credits yet. */
export interface CheckoutStatus {
  checkoutId: string;
  status: 'pending' | 'credited';
}

/** The six 0–10 axes behind a moment's 0–100 score. */
export interface ComponentScores {
  hook: number;
  clarity: number;
  novelty: number;
  emotion: number;
  completeness: number;
  shareability: number;
}

/**
 * Credits are split when granted: `rollover` carries into later months,
 * `expiring` does not. `rolloverShare` is the split applied (0.9 = 90% rolls over).
 */
export interface CreditBalance {
  credits: { rollover: number; expiring: number; total: number };
  rolloverShare: number;
  /** 'free' until a subscription is active. */
  plan: string;
  subscription: {
    status: string;
    recurringInterval: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  plans: { id: string; name: string; monthlyCredits: number }[];
}

/** What work costs in credits, as the server charges it. */
export interface CreditCosts {
  /** When false nothing is charged and nothing is refused for lack of credits. */
  enforced: boolean;
  /** Per started minute of source video, charged once when it is processed. */
  perSourceMinute: number;
  /** Per clip render, including re-renders. */
  perRender: number;
}

export type FramingMode = 'auto' | 'center' | 'fit';

/** Short-lived signed URLs for the source video; re-fetched before they expire. */
export interface Playback {
  sourceUrl: string | null;
  isProxy: boolean;
  thumbnailUrl: string | null;
  expiresAt: string;
}

/**
 * An SSE progress update. Advisory only — the UI still polls GET endpoints,
 * so a missed event never leaves the screen wrong.
 */
export interface ProgressEvent {
  type: 'video.updated' | 'render.updated' | 'credits.updated' | 'subscription.updated';
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

/** Supported output frames: 9:16 (1080×1920), 4:5 (1080×1350), 1:1 (1080×1080), 16:9 (1920×1080). */
export type AspectRatio = '9:16' | '4:5' | '1:1' | '16:9';

export interface RenderSettings {
  aspectRatio: AspectRatio;
  framingMode: FramingMode;
  captions: { enabled: boolean; preset: CaptionPreset };
  output: { width: number; height: number };
}

/** Mirrors the API's render status vocabulary (PRD §29). */
export type RenderStatus =
  | 'QUEUED'
  | 'PREPARING'
  | 'ANALYZING_VISUALS'
  | 'RENDERING'
  | 'UPLOADING'
  | 'COMPLETED'
  | 'FAILED';

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
  video?: {
    id: string;
    title: string;
    durationMs: number | null;
    width: number | null;
    height: number | null;
    status: VideoStatus;
  } | null;
  candidate?: {
    id: string;
    title: string;
    score: number;
    startMs: number;
    endMs: number;
    reason: string;
    category: string;
  } | null;
  versions?: {
    id: string;
    version: number;
    status: RenderStatus;
    isLatest: boolean;
    createdAt: string;
    startMs: number;
    endMs: number;
    settings: RenderSettings;
  }[];
}

/** A window of the transcript, fetched per clip rather than all at once. */
export interface TranscriptRange {
  language: string | null;
  provider: string;
  startMs: number;
  endMs: number;
  segments: { id: string; startMs: number; endMs: number; text: string; speaker?: string }[];
  words: { startMs: number; endMs: number; text: string; speaker?: string }[];
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  plan: string;
  createdAt: string;
  usage: { transcribedMinutes: number; renderedSeconds: number };
}

/** Mirrors the API's video status vocabulary (PRD §29). */
export type VideoStatus =
  | 'CREATED'
  | 'UPLOADING'
  | 'QUEUED'
  | 'INGESTING'
  | 'TRANSCRIBING'
  | 'ANALYZING'
  | 'READY'
  | 'FAILED';

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
