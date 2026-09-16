"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = register;
const typebox_1 = require("@sinclair/typebox");
const rate_limit_1 = require("./rate-limit");
const retry_1 = require("./retry");
const circuit_1 = require("./circuit");
const persistence_1 = require("./persistence");
// ── Singleton engines ──
const persistence = new persistence_1.JsonPersistence();
const rateLimitEngine = new rate_limit_1.RateLimitEngine(persistence);
const circuitEngine = new circuit_1.CircuitBreakerEngine(persistence);
// ── Helper ──
function toolResult(text, details) {
    return {
        content: [{ type: "text", text }],
        details,
    };
}
// ── Tool: rate_limit_check ──
const RateLimitCheckParams = typebox_1.Type.Object({
    key: typebox_1.Type.String({ description: "Named key for the rate-limit policy (e.g. provider name, tool name)" }),
    action: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal("check"), typebox_1.Type.Literal("add_policy"), typebox_1.Type.Literal("remove_policy"), typebox_1.Type.Literal("reset")], { description: "Action to perform (default: check)" })),
    algorithm: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal("token_bucket"), typebox_1.Type.Literal("sliding_window")], {
        description: "Rate-limit algorithm (required for add_policy)",
    })),
    capacity: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Token bucket capacity (for add_policy with token_bucket)" })),
    refillRate: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Tokens per second (for add_policy with token_bucket)" })),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Max requests per window (for add_policy with sliding_window)" })),
    windowMs: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Window duration in ms (for add_policy with sliding_window)" })),
    consume: typebox_1.Type.Optional(typebox_1.Type.Boolean({ description: "Whether to consume a token on check (default: true)" })),
});
function registerRateLimitCheck(pi) {
    pi.registerTool({
        name: "rate_limit_check",
        label: "Rate Limit Check",
        description: "Evaluate whether a named tool/provider/action is allowed under a configured rate-limit policy (token bucket or sliding window). Add/remove policies, check quota, or reset counters.",
        parameters: RateLimitCheckParams,
        async execute(_toolCallId, params) {
            const { key, action = "check", consume = true } = params;
            switch (action) {
                case "add_policy": {
                    const { algorithm, capacity, refillRate, limit, windowMs } = params;
                    if (!algorithm) {
                        return toolResult(JSON.stringify({ error: "algorithm is required for add_policy" }), { error: true });
                    }
                    if (algorithm === "token_bucket") {
                        if (!capacity || !refillRate) {
                            return toolResult(JSON.stringify({ error: "capacity and refillRate required for token_bucket" }), { error: true });
                        }
                        rateLimitEngine.addPolicy(key, { algorithm: "token_bucket", capacity, refillRate });
                    }
                    else {
                        if (!limit || !windowMs) {
                            return toolResult(JSON.stringify({ error: "limit and windowMs required for sliding_window" }), { error: true });
                        }
                        rateLimitEngine.addPolicy(key, { algorithm: "sliding_window", limit, windowMs });
                    }
                    return toolResult(`Policy "${key}" added (${algorithm})`, { key, action: "add_policy", algorithm });
                }
                case "remove_policy": {
                    const removed = rateLimitEngine.removePolicy(key);
                    return toolResult(removed ? `Policy "${key}" removed` : `Policy "${key}" not found`, { key, action: "remove_policy", removed });
                }
                case "reset": {
                    rateLimitEngine.reset(key);
                    return toolResult(`Rate limit counters reset for "${key}"`, { key, action: "reset" });
                }
                case "check":
                default: {
                    const result = rateLimitEngine.check(key, consume);
                    return toolResult(JSON.stringify(result, null, 2), result);
                }
            }
        },
    });
}
// ── Tool: retry_plan ──
const RetryPlanParams = typebox_1.Type.Object({
    attempt: typebox_1.Type.Number({ description: "Current attempt number (0-based or 1-based, your choice)" }),
    maxAttempts: typebox_1.Type.Number({ description: "Maximum number of attempts" }),
    baseDelayMs: typebox_1.Type.Number({ description: "Base delay in milliseconds" }),
    multiplier: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Backoff multiplier (default: 2)" })),
    maxDelayMs: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Maximum delay cap in ms (default: 30000)" })),
    jitter: typebox_1.Type.Optional(typebox_1.Type.Object({
        type: typebox_1.Type.Union([typebox_1.Type.Literal("none"), typebox_1.Type.Literal("full"), typebox_1.Type.Literal("equal")], {
            description: "Jitter strategy: none, full (0 to delay), equal (delay/2 to delay)",
        }),
        seed: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Deterministic seed for reproducible jitter" })),
    })),
    retryableErrors: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String(), { description: "List of retryable error class names or codes" })),
    errorCode: typebox_1.Type.Optional(typebox_1.Type.String({ description: "Error code to check against retryableErrors" })),
    errorMessage: typebox_1.Type.Optional(typebox_1.Type.String({ description: "Error message to check against retryableErrors" })),
});
function registerRetryPlan(pi) {
    pi.registerTool({
        name: "retry_plan",
        label: "Retry Plan",
        description: "Generate a deterministic retry/backoff plan for a failed action. Supports exponential backoff with configurable base, multiplier, jitter, max attempts, and retryable error classes. Returns ordered delay schedule with wall-clock estimates.",
        parameters: RetryPlanParams,
        async execute(_toolCallId, params) {
            const result = (0, retry_1.computeRetryPlan)(params);
            return toolResult(JSON.stringify(result, null, 2), result);
        },
    });
}
// ── Tool: circuit_status ──
const CircuitStatusParams = typebox_1.Type.Object({
    key: typebox_1.Type.String({ description: "Named key for the circuit (e.g. provider name, tool name)" }),
    action: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal("record_success"), typebox_1.Type.Literal("record_failure"), typebox_1.Type.Literal("status"), typebox_1.Type.Literal("reset")], { description: "Action to perform (default: status)" })),
    failureThreshold: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Failure count to trip circuit (default: 5)" })),
    cooldownMs: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Cooldown duration in ms (default: 30000)" })),
    halfOpenMaxAttempts: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Max probe attempts in half-open (default: 1)" })),
    configure: typebox_1.Type.Optional(typebox_1.Type.Boolean({ description: "Set to true to configure/reconfigure the circuit" })),
    now: typebox_1.Type.Optional(typebox_1.Type.Number({ description: "Deterministic timestamp override for testing" })),
});
function registerCircuitStatus(pi) {
    pi.registerTool({
        name: "circuit_status",
        label: "Circuit Status",
        description: "Track and report circuit-breaker state (closed/open/half-open) for a named tool/provider. Record successes/failures, check status, or manually reset. Supports configurable thresholds and cooldown periods.",
        parameters: CircuitStatusParams,
        async execute(_toolCallId, params) {
            const { key, action = "status", configure, failureThreshold, cooldownMs, halfOpenMaxAttempts, now } = params;
            if (configure) {
                circuitEngine.configure(key, {
                    failureThreshold: failureThreshold ?? 5,
                    cooldownMs: cooldownMs ?? 30_000,
                    halfOpenMaxAttempts: halfOpenMaxAttempts ?? 1,
                });
                return toolResult(`Circuit "${key}" configured (threshold=${failureThreshold ?? 5}, cooldown=${cooldownMs ?? 30000}ms)`, { key, action: "configure" });
            }
            const result = circuitEngine.act(key, action, now);
            return toolResult(JSON.stringify(result, null, 2), result);
        },
    });
}
// ── Extension registration ──
function register(pi) {
    registerRateLimitCheck(pi);
    registerRetryPlan(pi);
    registerCircuitStatus(pi);
}
//# sourceMappingURL=index.js.map