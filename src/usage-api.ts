import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import type { UsageData } from './types.js';
import { USAGE_CACHE_FILE, CONFIG_DIR } from './constants.js';

const USAGE_API_URL = 'https://api.anthropic.com/api/oauth/usage';
const CREDENTIALS_PATH = '.claude/.credentials.json';

const DEFAULT_CACHE_TTL_MS = 60_000;        // 60 seconds
const DEFAULT_FAILURE_CACHE_TTL_MS = 30_000; // 30 seconds

interface CredentialsFile {
  claudeAiOauth?: {
    accessToken?: string;
    subscriptionType?: string;
  };
}

interface UsageWindow {
  utilization?: number;
  resets_at?: string;
}

interface UsageApiResponse {
  five_hour?: UsageWindow;
  seven_day?: UsageWindow;
  seven_day_sonnet?: UsageWindow;
}

interface CacheFile {
  data: UsageData;
  timestamp: number;
}

interface GetUsageOptions {
  ttls?: {
    cacheTtlMs?: number;
    failureCacheTtlMs?: number;
  };
}

function getCachePath(): string {
  return join(homedir(), CONFIG_DIR, USAGE_CACHE_FILE);
}

interface Credentials {
  accessToken: string;
  planName: string | null;
}

function getPlanName(subscriptionType: string): string | null {
  const lower = subscriptionType.toLowerCase();
  if (lower.includes('max')) return 'Max';
  if (lower.includes('pro')) return 'Pro';
  if (lower.includes('team')) return 'Team';
  if (!subscriptionType || lower.includes('api')) return null;
  return subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);
}

/** Read OAuth token from macOS Keychain (Claude Code-credentials) */
function readFromKeychain(): CredentialsFile | null {
  try {
    const raw = execFileSync(
      'security',
      ['find-generic-password', '-s', 'Claude Code-credentials', '-w'],
      { timeout: 5000 },
    ).toString().trim();
    return JSON.parse(raw) as CredentialsFile;
  } catch {
    return null;
  }
}

/** Read plan name only (without full credentials) — used as fallback for plan display */
export async function readPlanName(): Promise<string | null> {
  const creds = await readCredentials();
  return creds?.planName ?? null;
}

async function readCredentials(): Promise<Credentials | null> {
  // 1. Try macOS Keychain first (Claude Code stores credentials here)
  const keychainData = readFromKeychain();
  if (keychainData?.claudeAiOauth?.accessToken) {
    const subscriptionType = keychainData.claudeAiOauth.subscriptionType ?? '';
    return {
      accessToken: keychainData.claudeAiOauth.accessToken,
      planName: getPlanName(subscriptionType),
    };
  }

  // 2. Fallback: file-based credentials
  const credPath = join(homedir(), CREDENTIALS_PATH);
  if (!existsSync(credPath)) return null;

  try {
    const raw = await readFile(credPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null) return null;

    const creds = parsed as CredentialsFile;
    const accessToken = creds.claudeAiOauth?.accessToken;
    if (!accessToken) return null;

    const subscriptionType = creds.claudeAiOauth?.subscriptionType ?? '';
    const planName = getPlanName(subscriptionType);

    return { accessToken, planName };
  } catch {
    return null;
  }
}

async function readCache(ttls: { cacheTtlMs: number; failureCacheTtlMs: number }): Promise<UsageData | null> {
  const cachePath = getCachePath();
  if (!existsSync(cachePath)) return null;

  try {
    const raw = await readFile(cachePath, 'utf-8');
    const cache: CacheFile = JSON.parse(raw) as CacheFile;
    const now = Date.now();

    const ttl = cache.data.apiUnavailable ? ttls.failureCacheTtlMs : ttls.cacheTtlMs;
    if (now - cache.timestamp < ttl) {
      // Rehydrate Date objects from ISO strings
      return {
        ...cache.data,
        fiveHourResetAt: cache.data.fiveHourResetAt ? new Date(cache.data.fiveHourResetAt) : null,
        sevenDayResetAt: cache.data.sevenDayResetAt ? new Date(cache.data.sevenDayResetAt) : null,
        sevenDaySonnetResetAt: cache.data.sevenDaySonnetResetAt ? new Date(cache.data.sevenDaySonnetResetAt) : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(data: UsageData): Promise<void> {
  const cachePath = getCachePath();
  const cacheDir = join(homedir(), CONFIG_DIR);

  try {
    await mkdir(cacheDir, { recursive: true });
    const cache: CacheFile = { data, timestamp: Date.now() };
    await writeFile(cachePath, JSON.stringify(cache), 'utf-8');
  } catch {
    // Cache write failures are non-fatal
  }
}

function parseApiResponse(body: UsageApiResponse, planName: string | null): UsageData {
  const fiveHour = body.five_hour;
  const sevenDay = body.seven_day;
  const sevenDaySonnet = body.seven_day_sonnet;

  // api.anthropic.com/api/oauth/usage returns utilization as 0–100 (percentage), not 0–1
  return {
    planName,
    fiveHour: typeof fiveHour?.utilization === 'number'
      ? Math.round(fiveHour.utilization)
      : null,
    sevenDay: typeof sevenDay?.utilization === 'number'
      ? Math.round(sevenDay.utilization)
      : null,
    sevenDaySonnet: typeof sevenDaySonnet?.utilization === 'number'
      ? Math.round(sevenDaySonnet.utilization)
      : null,
    fiveHourResetAt: fiveHour?.resets_at ? new Date(fiveHour.resets_at) : null,
    sevenDayResetAt: sevenDay?.resets_at ? new Date(sevenDay.resets_at) : null,
    sevenDaySonnetResetAt: sevenDaySonnet?.resets_at ? new Date(sevenDaySonnet.resets_at) : null,
  };
}

function makeFailure(apiError: string): UsageData {
  return {
    planName: null,
    fiveHour: null,
    sevenDay: null,
    sevenDaySonnet: null,
    fiveHourResetAt: null,
    sevenDayResetAt: null,
    sevenDaySonnetResetAt: null,
    apiUnavailable: true,
    apiError,
  };
}

async function fetchUsageFromApi(token: string, planName: string | null): Promise<UsageData | null> {
  const proxyEnv = process.env['https_proxy']
    ?? process.env['HTTPS_PROXY']
    ?? process.env['http_proxy']
    ?? process.env['HTTP_PROXY'];

  const args = ['-s', '--max-time', '10'];
  if (proxyEnv) args.push('--proxy', proxyEnv);
  args.push(
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'anthropic-beta: oauth-2025-04-20',
    USAGE_API_URL,
  );

  try {
    const raw = execFileSync('curl', args, { timeout: 12_000, encoding: 'utf-8' });
    const body = JSON.parse(raw) as UsageApiResponse;
    // API error envelope
    if ((body as { type?: string }).type === 'error') return makeFailure('api-error');
    return parseApiResponse(body, planName);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('status 1')) return makeFailure('network-error');
    if (err instanceof SyntaxError) return makeFailure('parse-error');
    return makeFailure('network-error');
  }
}

export async function getUsage(options?: GetUsageOptions): Promise<UsageData | null> {
  const ttls = {
    cacheTtlMs: options?.ttls?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
    failureCacheTtlMs: options?.ttls?.failureCacheTtlMs ?? DEFAULT_FAILURE_CACHE_TTL_MS,
  };

  const cached = await readCache(ttls);
  if (cached !== null) return cached;

  const credentials = await readCredentials();
  if (!credentials) return null;

  const data = await fetchUsageFromApi(credentials.accessToken, credentials.planName);
  if (data !== null) {
    await writeCache(data);
  }

  return data;
}
