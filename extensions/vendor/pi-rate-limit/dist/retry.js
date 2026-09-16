"use strict";
// ── Types ──
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRetryPlan = computeRetryPlan;
// ── Deterministic PRNG (xorshift32) ──
function xorshift32(seed) {
    let state = seed || 1;
    return () => {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        return (state >>> 0) / 4294967296;
    };
}
// ── Engine ──
function computeRetryPlan(input) {
    const { attempt, maxAttempts, baseDelayMs, multiplier = 2, maxDelayMs = 30_000, jitter = { type: "none" }, retryableErrors, errorCode, errorMessage, } = input;
    // Check if error is retryable
    if (retryableErrors && retryableErrors.length > 0) {
        const errIdentifier = errorCode ?? errorMessage ?? "";
        const isRetryable = retryableErrors.some((cls) => errIdentifier.includes(cls) || cls === "*");
        if (!isRetryable) {
            return {
                shouldRetry: false,
                nextDelayMs: 0,
                schedule: [],
                reason: `Error "${errIdentifier}" is not in retryable classes: [${retryableErrors.join(", ")}]`,
            };
        }
    }
    // Already exceeded max attempts
    if (attempt >= maxAttempts) {
        return {
            shouldRetry: false,
            nextDelayMs: 0,
            schedule: [],
            reason: `Attempt ${attempt} >= maxAttempts ${maxAttempts}`,
        };
    }
    // Build schedule from attempt+1 to maxAttempts
    const schedule = [];
    let cumulative = 0;
    const rng = jitter.seed !== undefined ? xorshift32(jitter.seed) : () => Math.random();
    for (let i = attempt + 1; i <= maxAttempts; i++) {
        const rawDelay = baseDelayMs * Math.pow(multiplier, i - 1);
        const cappedDelay = Math.min(rawDelay, maxDelayMs);
        let delay = cappedDelay;
        if (jitter.type === "full") {
            delay = Math.floor(rng() * cappedDelay);
        }
        else if (jitter.type === "equal") {
            const half = cappedDelay / 2;
            delay = Math.floor(half + rng() * half);
        }
        cumulative += delay;
        schedule.push({ attempt: i, delayMs: delay, cumulativeMs: cumulative });
    }
    const nextDelayMs = schedule[0]?.delayMs ?? 0;
    return {
        shouldRetry: true,
        nextDelayMs,
        schedule,
        reason: `Retry attempt ${attempt + 1}/${maxAttempts} — next delay ${nextDelayMs}ms`,
    };
}
//# sourceMappingURL=retry.js.map