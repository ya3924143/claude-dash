import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { USAGE_CACHE_FILE, CONFIG_DIR } from './constants.js';
const USAGE_API_URL = 'https://api.claude.ai/api/auth/usage';
const CREDENTIALS_PATH = '.claude/.credentials.json';
const DEFAULT_CACHE_TTL_MS = 60_000; // 60 seconds
const DEFAULT_FAILURE_CACHE_TTL_MS = 30_000; // 30 seconds
function getCachePath() {
    return join(homedir(), CONFIG_DIR, USAGE_CACHE_FILE);
}
async function readCredentials() {
    const credPath = join(homedir(), CREDENTIALS_PATH);
    if (!existsSync(credPath))
        return null;
    try {
        const raw = await readFile(credPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null)
            return null;
        const creds = parsed;
        return creds.claudeAiOauth?.accessToken ?? null;
    }
    catch {
        return null;
    }
}
async function readCache(ttls) {
    const cachePath = getCachePath();
    if (!existsSync(cachePath))
        return null;
    try {
        const raw = await readFile(cachePath, 'utf-8');
        const cache = JSON.parse(raw);
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
    }
    catch {
        return null;
    }
}
async function writeCache(data) {
    const cachePath = getCachePath();
    const cacheDir = join(homedir(), CONFIG_DIR);
    try {
        await mkdir(cacheDir, { recursive: true });
        const cache = { data, timestamp: Date.now() };
        await writeFile(cachePath, JSON.stringify(cache), 'utf-8');
    }
    catch {
        // Cache write failures are non-fatal
    }
}
function parseApiResponse(body, planName) {
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
async function fetchUsageFromApi(token) {
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
            const failureData = {
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
            const failureData = {
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
        const body = await response.json();
        if (typeof body !== 'object' || body === null) {
            return null;
        }
        return parseApiResponse(body, 'Max');
    }
    catch (error) {
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
export async function getUsage(options) {
    const ttls = {
        cacheTtlMs: options?.ttls?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
        failureCacheTtlMs: options?.ttls?.failureCacheTtlMs ?? DEFAULT_FAILURE_CACHE_TTL_MS,
    };
    const cached = await readCache(ttls);
    if (cached !== null)
        return cached;
    const token = await readCredentials();
    if (!token)
        return null;
    const data = await fetchUsageFromApi(token);
    if (data !== null) {
        await writeCache(data);
    }
    return data;
}
//# sourceMappingURL=usage-api.js.map