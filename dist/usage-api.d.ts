import type { UsageData } from './types.js';
interface GetUsageOptions {
    ttls?: {
        cacheTtlMs?: number;
        failureCacheTtlMs?: number;
    };
}
/** Read plan name only (without full credentials) — used as fallback for plan display */
export declare function readPlanName(): Promise<string | null>;
export declare function getUsage(options?: GetUsageOptions): Promise<UsageData | null>;
export {};
//# sourceMappingURL=usage-api.d.ts.map