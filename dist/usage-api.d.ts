import type { UsageData } from './types.js';
interface GetUsageOptions {
    ttls?: {
        cacheTtlMs?: number;
        failureCacheTtlMs?: number;
    };
}
export declare function getUsage(options?: GetUsageOptions): Promise<UsageData | null>;
export {};
//# sourceMappingURL=usage-api.d.ts.map