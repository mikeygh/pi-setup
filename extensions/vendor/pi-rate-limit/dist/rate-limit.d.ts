import { JsonPersistence } from "./persistence";
export type RateLimitAlgorithm = "token_bucket" | "sliding_window";
export interface TokenBucketConfig {
    algorithm: "token_bucket";
    capacity: number;
    refillRate: number;
    refillInterval?: number;
}
export interface SlidingWindowConfig {
    algorithm: "sliding_window";
    limit: number;
    windowMs: number;
}
export type PolicyConfig = TokenBucketConfig | SlidingWindowConfig;
export interface Policy {
    key: string;
    config: PolicyConfig;
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetMs: number;
    policy: {
        key: string;
        algorithm: RateLimitAlgorithm;
        capacity?: number;
        limit?: number;
    };
}
export declare class RateLimitEngine {
    private buckets;
    private windows;
    private policies;
    private persistence;
    constructor(persistence?: JsonPersistence);
    addPolicy(key: string, config: PolicyConfig): void;
    removePolicy(key: string): boolean;
    check(key: string, consume?: boolean, now?: number): RateLimitResult;
    private checkTokenBucket;
    private checkSlidingWindow;
    reset(key: string): void;
    private loadState;
    private saveState;
    private savePolicies;
}
//# sourceMappingURL=rate-limit.d.ts.map