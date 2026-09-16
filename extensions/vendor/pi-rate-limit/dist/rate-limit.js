"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitEngine = void 0;
const persistence_1 = require("./persistence");
// ── Engine ──
class RateLimitEngine {
    buckets = new Map();
    windows = new Map();
    policies = new Map();
    persistence;
    constructor(persistence) {
        this.persistence = persistence ?? new persistence_1.JsonPersistence();
        this.loadState();
    }
    addPolicy(key, config) {
        this.policies.set(key, config);
        this.savePolicies();
    }
    removePolicy(key) {
        const existed = this.policies.delete(key);
        if (existed) {
            this.buckets.delete(key);
            this.windows.delete(key);
            this.savePolicies();
            this.saveState();
        }
        return existed;
    }
    check(key, consume = true, now) {
        const ts = now ?? Date.now();
        const config = this.policies.get(key);
        if (!config) {
            return {
                allowed: true,
                remaining: Infinity,
                resetMs: 0,
                policy: { key, algorithm: "token_bucket" },
            };
        }
        if (config.algorithm === "token_bucket") {
            return this.checkTokenBucket(key, config, consume, ts);
        }
        return this.checkSlidingWindow(key, config, consume, ts);
    }
    checkTokenBucket(key, config, consume, now) {
        let state = this.buckets.get(key);
        if (!state) {
            state = { tokens: config.capacity, lastRefill: now };
            this.buckets.set(key, state);
        }
        // Refill tokens
        const elapsed = now - state.lastRefill;
        const refillInterval = config.refillInterval ?? 1000;
        const refillCount = Math.floor(elapsed / refillInterval) * (config.refillRate * (refillInterval / 1000));
        if (refillCount > 0) {
            state.tokens = Math.min(config.capacity, state.tokens + refillCount);
            state.lastRefill = now;
        }
        const allowed = state.tokens >= 1;
        const resetMs = allowed ? 0 : refillInterval;
        if (allowed && consume) {
            state.tokens -= 1;
            this.saveState();
        }
        return {
            allowed,
            remaining: Math.max(0, state.tokens),
            resetMs,
            policy: { key, algorithm: "token_bucket", capacity: config.capacity },
        };
    }
    checkSlidingWindow(key, config, consume, now) {
        let state = this.windows.get(key);
        if (!state) {
            state = { timestamps: [] };
            this.windows.set(key, state);
        }
        // Purge expired timestamps
        const windowStart = now - config.windowMs;
        state.timestamps = state.timestamps.filter((ts) => ts > windowStart);
        const allowed = state.timestamps.length < config.limit;
        const oldestInWindow = state.timestamps[0];
        const resetMs = allowed ? 0 : (oldestInWindow ? oldestInWindow + config.windowMs - now : config.windowMs);
        if (allowed && consume) {
            state.timestamps.push(now);
            this.saveState();
        }
        return {
            allowed,
            remaining: Math.max(0, config.limit - state.timestamps.length),
            resetMs,
            policy: { key, algorithm: "sliding_window", limit: config.limit },
        };
    }
    reset(key) {
        this.buckets.delete(key);
        this.windows.delete(key);
        this.saveState();
    }
    loadState() {
        const saved = this.persistence.load("rate_limit_state", { buckets: [], windows: [] });
        for (const [k, v] of saved.buckets) {
            this.buckets.set(k, v);
        }
        for (const [k, v] of saved.windows) {
            this.windows.set(k, v);
        }
        const savedPolicies = this.persistence.load("rate_limit_policies", []);
        for (const [k, v] of savedPolicies) {
            this.policies.set(k, v);
        }
    }
    saveState() {
        this.persistence.save("rate_limit_state", {
            buckets: Array.from(this.buckets.entries()),
            windows: Array.from(this.windows.entries()),
        });
    }
    savePolicies() {
        this.persistence.save("rate_limit_policies", Array.from(this.policies.entries()));
    }
}
exports.RateLimitEngine = RateLimitEngine;
//# sourceMappingURL=rate-limit.js.map