import { describe, it, expect } from 'vitest';
import { androidReleaseForSdk, parseApkInfo } from '@/lib/apk-info';

// Shape written by .github/scripts/android-apk-package.sh (elevari-build.json).
const published = {
  package: 'elevari.androidapp',
  versionName: '1.0.0',
  versionCode: 29_000_000,
  minSdk: 24,
  targetSdk: 36,
  sizeBytes: 42_123_456,
  sha256: 'ABCDEF0123456789'.repeat(4),
  signing: 'test',
  signerSha256: 'f'.repeat(64),
  abis: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
  commit: '0123456789abcdef',
  ref: 'refs/heads/b-main',
  builtAt: '2026-11-24T01:30:00Z',
  runUrl: 'https://github.com/Elevariapp/Elevari-repotransfer/actions/runs/1',
};

describe('APK build metadata', () => {
  it('accepts what the workflow publishes and lowercases the checksum', () => {
    const info = parseApkInfo(published);
    expect(info).toMatchObject({ versionName: '1.0.0', sizeBytes: 42_123_456, signing: 'test', minSdk: 24 });
    expect(info?.sha256).toBe('abcdef0123456789'.repeat(4));
    expect(info?.builtAt).toBe('2026-11-24T01:30:00.000Z');
  });

  it('refuses anything that could show a wrong checksum or the wrong app', () => {
    expect(parseApkInfo(null)).toBeNull();
    expect(parseApkInfo('{}')).toBeNull();
    expect(parseApkInfo({ ...published, package: 'com.other.app' })).toBeNull();
    expect(parseApkInfo({ ...published, sha256: 'abc123' })).toBeNull();
    expect(parseApkInfo({ ...published, sha256: 'g'.repeat(64) })).toBeNull();
    expect(parseApkInfo({ ...published, sizeBytes: 0 })).toBeNull();
    expect(parseApkInfo({ ...published, versionName: '<script>' })).toBeNull();
    expect(parseApkInfo({ ...published, builtAt: 'yesterday' })).toBeNull();
  });

  it('warns about a test signature unless the build says it is signed with the release key', () => {
    expect(parseApkInfo({ ...published, signing: 'release' })?.signing).toBe('release');
    expect(parseApkInfo({ ...published, signing: undefined })?.signing).toBe('test');
    expect(parseApkInfo({ ...published, signing: 'anything' })?.signing).toBe('test');
  });

  it('names the Android release for the minimum SDK, and nothing when it is unknown', () => {
    expect(androidReleaseForSdk(24)).toBe('7.0');
    expect(androidReleaseForSdk(null)).toBeNull();
    expect(parseApkInfo({ ...published, minSdk: 'x' })?.minSdk).toBeNull();
  });
});
