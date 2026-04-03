import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { UsageData } from './types.js';
import { USAGE_CACHE_FILE, CONFIG_DIR } from './constants.js';

const USAGE_API_URL = 'https://api.claude.ai/api/auth/usage';
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

async function readCredentials(): Promise<Credentials | null> {
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

  return {
    planName,
    fiveHour: typeof fiveHour?.utilization === 'number'
      ? Math.round(fiveHour.utilization * 100)
      : null,
    sevenDay: typeof sevenDay?.utilization === 'number'
      ? Math.round(sevenDay.utilization * 100)
      : null,
    fiveHourResetAt: fiveHour?.resets_at ? new Date(fiveHour.resets_at) : null,
    sevenDayResetAt: sevenDay?.resets_at ? new Date(sevenDay.resets_at) : null,
  };
}

async function fetchUsageFromApi(token: string, planName: string | null): Promise<UsageData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(USAGE_API_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      const failureData: UsageData = {
        planName: null,
        fiveHour: null,
        sevenDay: null,
        fiveHourResetAt: null,
        sevenDayResetAt: null,
        apiUnavailable: true,
        apiError: 'rate-limited',
      };
      return failureData;
    }

    if (!response.ok) {
      const failureData: UsageData = {
        planName: null,
        fiveHour: null,
        sevenDay: null,
        fiveHourResetAt: null,
        sevenDayResetAt: null,
        apiUnavailable: true,
        apiError: `http-${response.status}`,
      };
      return failureData;
    }

    const body: unknown = await response.json();
    if (typeof body !== 'object' || body === null) {
      return null;
    }

    return parseApiResponse(body as UsageApiResponse, planName);
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        planName: null,
        fiveHour: null,
        sevenDay: null,
        fiveHourResetAt: null,
        sevenDayResetAt: null,
        apiUnavailable: true,
        apiError: 'timeout',
      };
    }

    return {
      planName: null,
      fiveHour: null,
      sevenDay: null,
      fiveHourResetAt: null,
      sevenDayResetAt: null,
      apiUnavailable: true,
      apiError: 'network-error',
    };
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
