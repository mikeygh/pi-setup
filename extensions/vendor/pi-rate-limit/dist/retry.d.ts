export interface JitterConfig {
    type: "none" | "full" | "equal";
    seed?: number;
}
export interface RetryPlanInput {
    attempt: number;
    maxAttempts: number;
    baseDelayMs: number;
    multiplier?: number;
    maxDelayMs?: number;
    jitter?: JitterConfig;
    retryableErrors?: string[];
    errorCode?: string;
    errorMessage?: string;
}
export interface ScheduleEntry {
    attempt: number;
    delayMs: number;
    cumulativeMs: number;
}
export interface RetryPlanResult {
    shouldRetry: boolean;
    nextDelayMs: number;
    schedule: ScheduleEntry[];
    reason: string;
}
export declare function computeRetryPlan(input: RetryPlanInput): RetryPlanResult;
//# sourceMappingURL=retry.d.ts.map