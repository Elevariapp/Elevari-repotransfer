import { ANDROID_PACKAGE, APK_INFO_URL } from '@/lib/app-links';

/** What the "Mobile APK" workflow publishes next to the APK (elevari-build.json), after validation. */
export interface ApkInfo {
  versionName: string;
  versionCode: number;
  sizeBytes: number;
  sha256: string;
  /** "test" means a throwaway key: the next build cannot update this one in place. */
  signing: 'release' | 'test';
  builtAt: string;
  minSdk: number | null;
}

const ANDROID_RELEASE_FOR_SDK: Record<number, string> = {
  24: '7.0',
  25: '7.1',
  26: '8.0',
  27: '8.1',
  28: '9',
  29: '10',
  30: '11',
  31: '12',
  32: '12L',
  33: '13',
  34: '14',
  35: '15',
  36: '16',
};

export function androidReleaseForSdk(sdk: number | null): string | null {
  return sdk === null ? null : (ANDROID_RELEASE_FOR_SDK[sdk] ?? null);
}

const isInt = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

/**
 * The JSON comes from a public release, so nothing is rendered unless it is exactly what we expect.
 * Anything doubtful returns null and the page falls back to "coming soon" instead of a wrong checksum.
 */
export function parseApkInfo(raw: unknown): ApkInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;

  if (data.package !== ANDROID_PACKAGE) return null;
  if (typeof data.sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(data.sha256)) return null;
  if (typeof data.versionName !== 'string' || !/^[0-9A-Za-z][0-9A-Za-z._+-]{0,31}$/.test(data.versionName)) return null;
  if (!isInt(data.versionCode, 1, 2_100_000_000)) return null;
  if (!isInt(data.sizeBytes, 1, 500_000_000)) return null;
  if (typeof data.builtAt !== 'string' || Number.isNaN(Date.parse(data.builtAt))) return null;

  return {
    versionName: data.versionName,
    versionCode: data.versionCode,
    sizeBytes: data.sizeBytes,
    sha256: data.sha256.toLowerCase(),
    signing: data.signing === 'release' ? 'release' : 'test',
    builtAt: new Date(data.builtAt).toISOString(),
    minSdk: isInt(data.minSdk, 21, 40) ? data.minSdk : null,
  };
}

/** Metadata of the latest published APK, or null when none is published (or GitHub is unreachable). */
export async function getApkInfo(): Promise<ApkInfo | null> {
  try {
    const response = await fetch(APK_INFO_URL, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    return parseApkInfo(await response.json());
  } catch {
    return null;
  }
}
