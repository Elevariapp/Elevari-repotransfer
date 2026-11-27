#!/usr/bin/env node
/**
 * Small Firebase helper that uses the private service account in `.secrets/`.
 *
 *   node scripts/firebase-tools.mjs token
 *   node scripts/firebase-tools.mjs apps
 *   node scripts/firebase-tools.mjs google-services --api-key AIza...
 *
 * No npm dependency: the OAuth assertion is an RS256 JWT signed with node:crypto, which is
 * exactly what Google's service-account flow expects.
 *
 * The service account file is never read from the repository: `.secrets/` is git-ignored
 * (see .secrets/README.md). CI uses the `FIREBASE_SERVICE_ACCOUNT_BASE64` secret instead.
 */
import { createSign } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SA = join(ROOT, '.secrets', 'firebase-adminsdk.json');
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/firebase.messaging',
  'https://www.googleapis.com/auth/firebase',
  'https://www.googleapis.com/auth/cloud-platform',
].join(' ');

function loadServiceAccount() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (fromEnv) return JSON.parse(fromEnv);

  const fromBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (fromBase64) return JSON.parse(Buffer.from(fromBase64, 'base64').toString('utf8'));

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() || DEFAULT_SA;
  if (!existsSync(path)) {
    throw new Error(
      `Service account not found at ${path}. Place it in .secrets/firebase-adminsdk.json or set FIREBASE_SERVICE_ACCOUNT_JSON.`,
    );
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

const base64url = (value) =>
  Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

/** Signs the assertion Google wants for `urn:ietf:params:oauth:grant-type:jwt-bearer`. */
export function buildAssertion(account, scope = SCOPES, now = Math.floor(Date.now() / 1000)) {
  const header = { alg: 'RS256', typ: 'JWT', kid: account.private_key_id };
  const payload = { iss: account.client_email, scope, aud: TOKEN_URL, iat: now, exp: now + 3600 };
  const unsigned = `${base64url(header)}.${base64url(payload)}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key, 'base64url');
  return `${unsigned}.${signature}`;
}

export async function getAccessToken(account, scope = SCOPES) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildAssertion(account, scope),
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.access_token) {
    const reason = body?.error_description || body?.error || `HTTP ${response.status}`;
    throw new Error(`Could not mint a Google access token: ${reason}`);
  }
  return body.access_token;
}

/** 1:1046234066347:android:80fb2cf9cf15534432f6ee -> { projectNumber, platform, appId } */
export function parseAppId(mobilesdkAppId) {
  const match = /^1:(\d+):(android|ios|web):([0-9a-f]+)$/i.exec(mobilesdkAppId.trim());
  if (!match) throw new Error(`Invalid Firebase app id: ${mobilesdkAppId}`);
  return { projectNumber: match[1], platform: match[2].toLowerCase(), appId: mobilesdkAppId.trim() };
}

/** The file Gradle reads. The API key is the public browser key: it is not a secret. */
export function googleServicesFile({ projectId, projectNumber, mobilesdkAppId, apiKey, packageName }) {
  return {
    project_info: {
      project_number: projectNumber,
      project_id: projectId,
      storage_bucket: `${projectId}.appspot.com`,
    },
    client: [
      {
        client_info: {
          mobilesdk_app_id: mobilesdkAppId,
          android_client_info: { package_name: packageName },
        },
        oauth_client: [],
        api_key: [{ current_key: apiKey }],
        services: { appinvite_service: { other_platform_oauth_client: [] } },
      },
    ],
    configuration_version: '1',
  };
}

async function main() {
  const [command = 'token', ...rest] = process.argv.slice(2);
  const flag = (name) => {
    const index = rest.indexOf(`--${name}`);
    return index >= 0 ? rest[index + 1] : undefined;
  };

  const account = loadServiceAccount();

  if (command === 'token') {
    const token = await getAccessToken(account);
    console.log(`✓ Service account works. Token acquired (${token.length} chars).`);
    console.log(`  project: ${account.project_id}`);
    console.log(`  client:  ${account.client_email}`);
    return;
  }

  if (command === 'apps') {
    const token = await getAccessToken(account);
    const response = await fetch(
      `https://firebase.googleapis.com/v1beta1/projects/${account.project_id}/androidApps`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log(JSON.stringify(await response.json().catch(() => null), null, 2));
    return;
  }

  if (command === 'download-config') {
    // The authoritative google-services.json, straight from Firebase (base64 in the payload).
    const appId =
      flag('app-id') || process.env.FIREBASE_ANDROID_APP_ID || '1:1046234066347:android:80fb2cf9cf15534432f6ee';
    const token = await getAccessToken(account);
    const url = `https://firebase.googleapis.com/v1beta1/projects/${account.project_id}/androidApps/${appId}/config`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.configFileContents) {
      throw new Error(`Could not download the config: ${body?.error?.message || `HTTP ${response.status}`}`);
    }
    const out = flag('out') || join(ROOT, '.secrets', 'google-services.json');
    writeFileSync(out, Buffer.from(body.configFileContents, 'base64'));
    console.log(`✓ Wrote ${out} (${body.configFilename || 'google-services.json'})`);
    return;
  }

  if (command === 'google-services') {
    const mobilesdkAppId =
      flag('app-id') || process.env.FIREBASE_ANDROID_APP_ID || '1:1046234066347:android:80fb2cf9cf15534432f6ee';
    const apiKey = flag('api-key') || process.env.FIREBASE_BROWSER_API_KEY;
    const packageName = flag('package') || 'elevari.androidapp';
    if (!apiKey) {
      throw new Error(
        'Pass the public browser API key: --api-key AIza... (Firebase Console → Project settings → General → Web API Key)',
      );
    }
    const { projectNumber } = parseAppId(mobilesdkAppId);
    const file = googleServicesFile({
      projectId: account.project_id,
      projectNumber,
      mobilesdkAppId,
      apiKey,
      packageName,
    });
    const out = flag('out') || join(ROOT, '.secrets', 'google-services.json');
    writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`);
    console.log(`✓ Wrote ${out}`);
    console.log(
      '  Add it to CI: gh secret set GOOGLE_SERVICES_JSON --body (Get-Content .\\.secrets\\google-services.json -Raw)',
    );
    return;
  }

  throw new Error(`Unknown command: ${command}. Use token | apps | google-services.`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
