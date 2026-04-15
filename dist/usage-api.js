import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { USAGE_CACHE_FILE, CONFIG_DIR } from './constants.js';
const USAGE_API_URL = 'https://api.anthropic.com/api/oauth/usage';
const CREDENTIALS_PATH = '.claude/.credentials.json';
const DEFAULT_CACHE_TTL_MS = 60_000; // 60 seconds
const DEFAULT_FAILURE_CACHE_TTL_MS = 30_000; // 30 seconds
function getCachePath() {
    return join(homedir(), CONFIG_DIR, USAGE_CACHE_FILE);
}
function getPlanName(subscriptionType) {
    const lower = subscriptionType.toLowerCase();
    if (lower.includes('max'))
        return 'Max';
    if (lower.includes('pro'))
        return 'Pro';
    if (lower.includes('team'))
        return 'Team';
    if (!subscriptionType || lower.includes('api'))
        return null;
    return subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);
}
/** Read OAuth token from macOS Keychain (Claude Code-credentials) */
function readFromKeychain() {
    try {
        const raw = execFileSync('security', ['find-generic-password', '-s', 'Claude Code-credentials', '-w'], { timeout: 5000 }).toString().trim();
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
/** Read plan name only (without full credentials) — used as fallback for plan display */
export async function readPlanName() {
    const creds = await readCredentials();
    return creds?.planName ?? null;
}
async function readCredentials() {
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
    if (!existsSync(credPath))
        return null;
    try {
        const raw = await readFile(credPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null)
            return null;
        const creds = parsed;
        const accessToken = creds.claudeAiOauth?.accessToken;
        if (!accessToken)
            return null;
        const subscriptionType = creds.claudeAiOauth?.subscriptionType ?? '';
        const planName = getPlanName(subscriptionType);
        return { accessToken, planName };
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
                sevenDaySonnetResetAt: cache.data.sevenDaySonnetResetAt ? new Date(cache.data.sevenDaySonnetResetAt) : null,
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
function makeFailure(apiError) {
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
async function fetchUsageFromApi(token, planName) {
    const proxyEnv = process.env['https_proxy']
        ?? process.env['HTTPS_PROXY']
        ?? process.env['http_proxy']
        ?? process.env['HTTP_PROXY'];
    const args = ['-s', '--max-time', '10'];
    if (proxyEnv)
        args.push('--proxy', proxyEnv);
    args.push('-H', `Authorization: Bearer ${token}`, '-H', 'anthropic-beta: oauth-2025-04-20', USAGE_API_URL);
    try {
        const raw = execFileSync('curl', args, { timeout: 12_000, encoding: 'utf-8' });
        const body = JSON.parse(raw);
        // API error envelope
        if (body.type === 'error')
            return makeFailure('api-error');
        return parseApiResponse(body, planName);
    }
    catch (err) {
        if (err instanceof Error && err.message.includes('status 1'))
            return makeFailure('network-error');
        if (err instanceof SyntaxError)
            return makeFailure('parse-error');
        return makeFailure('network-error');
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
    const credentials = await readCredentials();
    if (!credentials)
        return null;
    const data = await fetchUsageFromApi(credentials.accessToken, credentials.planName);
    if (data !== null) {
        await writeCache(data);
    }
    return data;
}
//# sourceMappingURL=usage-api.js.map