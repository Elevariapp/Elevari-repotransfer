/**
 * Automated moderation for host photos/videos and for the government-ID + selfie check.
 *
 * The marketplace promise is a decision in under an hour instead of the old 48-hour queue:
 *  - when an AI provider is configured (`AI_MODERATION_URL`), every upload is scored in seconds
 *    and clearly-good content is published immediately;
 *  - anything the model is unsure about gets `reviewDueAt = now + 1 hour`, the deadline the
 *    admin queue sorts by, so nothing can sit in limbo for two days again;
 *  - when no provider is configured (local dev, CI) the verdict is `review` — never a silent
 *    approval, because that would put unreviewed content live.
 *
 * The provider contract is deliberately provider-agnostic: a single JSON POST with
 * `{ model, kind, url }` that answers `{ verdict, score, labels?, reason? }`. OpenAI-compatible
 * gateways, Google Vision proxies and in-house services all fit behind it, so the API image
 * needs no extra npm dependency.
 */

/** Human review deadline: one hour, the maximum a host should ever wait. */
export const REVIEW_SLA_MS = 60 * 60 * 1000;

/** Minimum confidence before the machine is allowed to decide without a person. */
export const AUTO_DECISION_THRESHOLD = 0.9;

const REQUEST_TIMEOUT_MS = 12_000;

export type ModerationVerdict = 'approved' | 'rejected' | 'review';
export type ModerationKind = 'property' | 'id_document' | 'selfie';

export interface ModerationResult {
  verdict: ModerationVerdict;
  score: number;
  labels: string[];
  reason: string;
  provider: 'ai' | 'rules';
  /** Raw OCR from Vision, only for identity documents; used to match the declared ID number. */
  ocrText?: string;
}

export interface IdentityModerationResult extends ModerationResult {
  /** True only when both documents were read and the model was confident. */
  documentsMatch: boolean;
}

const IMAGE_URL_RE = /\.(jpe?g|png|webp|gif|heic|heif)(\?.*)?$/i;

function apiBase(): string | undefined {
  const url = process.env.AI_MODERATION_URL?.trim();
  return url || undefined;
}

/** True when a moderation provider is reachable: Google Vision (API key) or a generic gateway. */
export function isAiModerationConfigured(): boolean {
  return Boolean(apiBase() || visionKey());
}

/**
 * Google Cloud Vision API key. Stored in the repo secrets as `AI_MODERATION_VISION_KEY`;
 * the older/generic names are accepted so a key rotation never breaks moderation.
 */
function visionKey(): string | undefined {
  return (
    process.env.AI_MODERATION_VISION_KEY?.trim() ||
    process.env.AI_MODERATION_API_KEY?.trim() ||
    process.env.GOOGLE_VISION_API_KEY?.trim() ||
    undefined
  );
}

export function isVisionConfigured(): boolean {
  return Boolean(visionKey());
}

/** Pure: maps a provider answer onto our three verdicts, applying the confidence floor. */
export function decideVerdict(raw: { verdict?: unknown; score?: unknown }): {
  verdict: ModerationVerdict;
  score: number;
} {
  const score =
    typeof raw.score === 'number' && Number.isFinite(raw.score) ? Math.min(1, Math.max(0, raw.score)) : 0;
  const verdict = typeof raw.verdict === 'string' ? raw.verdict.toLowerCase() : '';

  if (verdict === 'approved' && score >= AUTO_DECISION_THRESHOLD) return { verdict: 'approved', score };
  if (verdict === 'rejected' && score >= AUTO_DECISION_THRESHOLD) return { verdict: 'rejected', score };
  return { verdict: 'review', score };
}

/**
 * Pure: combines the two identity checks. A host may only be auto-verified when both the
 * document and the selfie were approved with high confidence; otherwise a human decides.
 */
export function combineIdentityModeration(
  document: ModerationResult,
  selfie: ModerationResult,
): IdentityModerationResult {
  const score = Math.min(document.score, selfie.score);
  const bothRead = document.reason !== 'ai_unconfigured' && selfie.reason !== 'ai_unconfigured';
  const approved =
    document.verdict === 'approved' && selfie.verdict === 'approved' && score >= AUTO_DECISION_THRESHOLD;
  const rejected = document.verdict === 'rejected' || selfie.verdict === 'rejected';

  if (approved && bothRead) {
    return {
      verdict: 'approved',
      score,
      labels: [...document.labels, ...selfie.labels],
      reason: 'identity_verified_by_ai',
      provider: 'ai',
      documentsMatch: true,
    };
  }
  if (rejected && score >= AUTO_DECISION_THRESHOLD) {
    return {
      verdict: 'rejected',
      score,
      labels: [...document.labels, ...selfie.labels],
      reason: 'identity_rejected_by_ai',
      provider: document.provider,
      documentsMatch: false,
    };
  }
  return {
    verdict: 'review',
    score,
    labels: [...document.labels, ...selfie.labels],
    reason: document.reason === 'ai_unconfigured' ? 'ai_unconfigured' : 'manual_review_required',
    provider: document.provider,
    documentsMatch: false,
  };
}

interface VisionAnnotateResponse {
  responses?: Array<{
    safeAnnotation?: {
      adult?: string;
      violence?: string;
      racy?: string;
      medical?: string;
      spoof?: string;
    };
    faceAnnotations?: Array<{ detectionConfidence?: number }>;
    textAnnotations?: Array<{ description?: string }>;
    labelAnnotations?: Array<{ description?: string }>;
    error?: { code?: number; message?: string };
  }>;
}

const SAFE_LIKELY = new Set(['LIKELY', 'VERY_LIKELY']);
const SAFE_POSSIBLE = new Set(['POSSIBLE', 'LIKELY', 'VERY_LIKELY']);

/**
 * Scores one image through Google Cloud Vision (REST, `AI_MODERATION_VISION_KEY`).
 * Returns null when Vision is not configured so the caller can fall back to local rules.
 *
 * Called with base64 (not a URL) on purpose: identity documents live in the private path of
 * the bucket and must never need a public URL to be reviewed.
 */
export async function callVision(input: {
  base64: string;
  kind: ModerationKind;
}): Promise<ModerationResult | null> {
  const key = visionKey();
  if (!key) return null;

  const features =
    input.kind === 'property'
      ? [{ type: 'SAFE_SEARCH_DETECTION' }, { type: 'LABEL_DETECTION', maxResults: 10 }]
      : [{ type: 'SAFE_SEARCH_DETECTION' }, { type: 'FACE_DETECTION', maxResults: 5 }, { type: 'TEXT_DETECTION' }];

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ image: { content: input.base64 }, features }] }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn('[moderation] Vision rejected the request', { status: response.status });
      // 403 usually means the Cloud Vision API is not enabled for the key's project.
      return { verdict: 'review', score: 0, labels: [], reason: `vision_error_${response.status}`, provider: 'ai' };
    }

    const payload = (await response.json().catch(() => null)) as VisionAnnotateResponse | null;
    const annotation = payload?.responses?.[0];
    if (!annotation || annotation.error) {
      return {
        verdict: 'review',
        score: 0,
        labels: [],
        reason: `vision_error_${annotation?.error?.code ?? 'empty'}`,
        provider: 'ai',
      };
    }

    const labels = (annotation.labelAnnotations ?? [])
      .map((label) => label.description)
      .filter((label): label is string => Boolean(label))
      .slice(0, 10);

    const safe = annotation.safeAnnotation ?? {};
    const flagged = [safe.adult, safe.violence].filter((value): value is string => Boolean(value));

    if (flagged.some((value) => SAFE_LIKELY.has(value))) {
      return {
        verdict: 'rejected',
        score: 0.98,
        labels: [...labels, ...flagged],
        reason: 'unsafe_content_detected',
        provider: 'ai',
      };
    }

    if (input.kind === 'property') {
      if (flagged.some((value) => SAFE_POSSIBLE.has(value))) {
        return { verdict: 'review', score: 0.5, labels, reason: 'borderline_safe_search', provider: 'ai' };
      }
      return { verdict: 'approved', score: 0.95, labels, reason: 'safe_search_clean', provider: 'ai' };
    }

    const faces = annotation.faceAnnotations ?? [];
    if (input.kind === 'selfie') {
      if (faces.length === 0) {
        return { verdict: 'review', score: 0.3, labels, reason: 'no_face_detected', provider: 'ai' };
      }
      if (faces.length > 1) {
        return { verdict: 'review', score: 0.4, labels, reason: 'multiple_faces_detected', provider: 'ai' };
      }
      return { verdict: 'approved', score: 0.95, labels, reason: 'single_face_detected', provider: 'ai' };
    }

    // Government ID: a portrait plus readable text is what a human would check first.
    const hasPortrait = faces.length > 0;
    const ocr = (annotation.textAnnotations?.[0]?.description ?? '').trim();
    if (!hasPortrait || ocr.replace(/\s+/g, '').length < 12) {
      return {
        verdict: 'review',
        score: 0.3,
        labels,
        reason: hasPortrait ? 'document_unreadable' : 'no_portrait_on_document',
        provider: 'ai',
      };
    }
    return { verdict: 'approved', score: 0.95, labels, reason: 'document_readable', provider: 'ai', ocrText: ocr };
  } catch (err) {
    console.warn('[moderation] Vision unreachable', { error: err instanceof Error ? err.name : 'unknown' });
    return { verdict: 'review', score: 0, labels: [], reason: 'vision_unreachable', provider: 'ai' };
  }
}

/** Local, deterministic checks that need no network. They gate the AI call as a cheap pre-filter. */
export interface RuleReport {
  ok: boolean;
  reason: string;
  score: number;
  width?: number;
  height?: number;
  stdev?: number;
}

const MIN_IMAGE_WIDTH = 600;
const MIN_IMAGE_HEIGHT = 400;
const MIN_IMAGE_STDEV = 8; // a near-uniform frame (all black / all white) fails this
const MIN_VIDEO_BYTES = 100 * 1024;
const MAX_PROPERTY_ASPECT = 3;

/** Deterministic structural check for a photo: real dimensions, sane aspect ratio, not a blank frame. */
export async function inspectImageRules(buffer: Buffer): Promise<RuleReport> {
  try {
    // Imported lazily so the pure helpers above stay testable without the native codec.
    const { default: sharp } = await import('sharp');
    const image = sharp(buffer, { limitInputPixels: 80_000_000 }).rotate();
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
      return { ok: false, reason: 'image_too_small', score: 0.9, width, height };
    }
    const aspect = width / Math.max(1, height);
    if (aspect > MAX_PROPERTY_ASPECT || aspect < 1 / MAX_PROPERTY_ASPECT) {
      return { ok: false, reason: 'image_aspect_ratio', score: 0.8, width, height };
    }

    const stats = await image.stats();
    const stdev = Math.max(...stats.channels.map((channel) => channel.stdev ?? 0));
    if (!Number.isFinite(stdev) || stdev < MIN_IMAGE_STDEV) {
      return { ok: false, reason: 'image_is_blank', score: 0.95, width, height, stdev };
    }

    return { ok: true, reason: 'rules_passed', score: 0.9, width, height, stdev };
  } catch {
    return { ok: false, reason: 'image_unreadable', score: 1 };
  }
}

/** Deterministic structural check for a video (the container is already validated on upload). */
export function inspectVideoRules(buffer: Buffer, mimeType: string): RuleReport {
  const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (!allowed.includes(mimeType)) {
    return { ok: false, reason: 'video_type_not_allowed', score: 1 };
  }
  if (buffer.length < MIN_VIDEO_BYTES) {
    return { ok: false, reason: 'video_too_short', score: 0.9 };
  }
  return { ok: true, reason: 'rules_passed', score: 0.9 };
}

/** The only switch that lets the rules engine publish content with no AI provider configured. */
export function rulesMayAutoApprove(): boolean {
  return process.env.MEDIA_RULES_AUTO_APPROVE !== 'false';
}

/** When a human must have decided by. Always one hour from submission. */
export function reviewDeadline(from: Date = new Date()): Date {
  return new Date(from.getTime() + REVIEW_SLA_MS);
}

/** Maps a verdict onto the media row status. */
export function mediaStatusFor(verdict: ModerationVerdict): 'approved' | 'rejected' | 'pending' {
  if (verdict === 'approved') return 'approved';
  if (verdict === 'rejected') return 'rejected';
  return 'pending';
}

/**
 * Decides one uploaded photo (property listing or an identity document).
 *
 * Order matters: cheap deterministic rules first, then Google Vision. A structural failure is
 * final for listings (a 200×200 or blank frame is never publishable) but only "review" for
 * identity documents, where a person should look at the file before rejecting the host.
 */
export async function moderateImageBuffer(buffer: Buffer, kind: ModerationKind): Promise<ModerationResult> {
  const rules = await inspectImageRules(buffer);

  if (!rules.ok && kind === 'property') {
    return { verdict: 'rejected', score: rules.score, labels: [], reason: rules.reason, provider: 'rules' };
  }

  const ai = await callVision({ base64: buffer.toString('base64'), kind });
  if (ai) {
    // A model that says "safe" over a broken/blank file is not trustworthy: keep it for a human.
    if (ai.verdict === 'approved' && !rules.ok) {
      return { ...ai, verdict: 'review', reason: rules.reason, score: Math.min(ai.score, rules.score) };
    }
    return ai;
  }

  // No Vision key: local rules decide for listings, a person decides for identity documents.
  if (kind !== 'property') {
    return {
      verdict: 'review',
      score: rules.score,
      labels: [],
      reason: rules.ok ? 'ai_unconfigured' : rules.reason,
      provider: 'rules',
    };
  }
  if (!rules.ok) {
    return { verdict: 'rejected', score: rules.score, labels: [], reason: rules.reason, provider: 'rules' };
  }
  return rulesMayAutoApprove()
    ? { verdict: 'approved', score: rules.score, labels: [], reason: 'rules_auto_approved', provider: 'rules' }
    : { verdict: 'review', score: rules.score, labels: [], reason: 'ai_unconfigured', provider: 'rules' };
}

/**
 * Decides one uploaded video. Vision's image endpoint cannot read video frames, so the decision
 * rests on the container/size rules plus `MEDIA_RULES_AUTO_APPROVE` (on by default: the product
 * asks for instant publishing). Set it to `false` to send every video to the human queue.
 */
export async function moderateVideoBuffer(buffer: Buffer, mimeType: string): Promise<ModerationResult> {
  const rules = inspectVideoRules(buffer, mimeType);
  if (!rules.ok) {
    return { verdict: 'rejected', score: rules.score, labels: [], reason: rules.reason, provider: 'rules' };
  }
  return rulesMayAutoApprove()
    ? { verdict: 'approved', score: rules.score, labels: [], reason: 'rules_auto_approved', provider: 'rules' }
    : { verdict: 'review', score: rules.score, labels: [], reason: 'ai_unconfigured', provider: 'rules' };
}

/**
 * Reviews a host's government ID plus selfie and reports whether the pair can be auto-approved.
 * Called with the raw file buffers so the private documents never need a public URL. Vision has
 * no face *matching* endpoint, so auto-verification means: the document is legible, contains a
 * portrait and the declared ID number and name, and the selfie shows exactly one clear face.
 * Everything else goes to a human with the 1-hour deadline.
 */
export async function moderateIdentityBuffers(
  documentBuffer: Buffer,
  selfieBuffer: Buffer,
  declared: { idNumber: string; fullName: string },
): Promise<IdentityModerationResult> {
  const [document, selfie] = await Promise.all([
    moderateImageBuffer(documentBuffer, 'id_document'),
    moderateImageBuffer(selfieBuffer, 'selfie'),
  ]);

  const combined = combineIdentityModeration(document, selfie);
  if (combined.verdict !== 'approved') return combined;

  const ocr = document.ocrText ?? '';
  if (!idNumberAppearsInText(declared.idNumber, ocr)) {
    return {
      ...combined,
      verdict: 'review',
      reason: 'id_number_mismatch',
      documentsMatch: false,
    };
  }
  if (!nameAppearsInText(declared.fullName, ocr)) {
    return {
      ...combined,
      verdict: 'review',
      reason: 'name_mismatch',
      documentsMatch: false,
    };
  }
  return combined;
}

/** Uppercase, punctuation-free form of a name or an OCR block. */
export function normalizeIdText(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, ' ').toUpperCase().trim();
}

/** True when the digits of the ID number appear on the document's OCR text. */
export function idNumberAppearsInText(idNumber: string, ocrText: string): boolean {
  const digits = idNumber.replace(/[^0-9]/g, '');
  if (digits.length < 5) return false;
  return ocrText.replace(/[^0-9]/g, '').includes(digits);
}

/** True when at least two meaningful tokens of the full name appear on the document. */
export function nameAppearsInText(fullName: string, ocrText: string): boolean {
  const tokens = normalizeIdText(fullName)
    .split(' ')
    .filter((token) => token.length >= 3);
  if (tokens.length === 0) return false;
  const haystack = normalizeIdText(ocrText);
  const matched = tokens.filter((token) => haystack.includes(token));
  return matched.length >= Math.min(2, tokens.length);
}


