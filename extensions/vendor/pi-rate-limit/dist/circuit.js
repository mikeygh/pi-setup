"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerEngine = void 0;
const persistence_1 = require("./persistence");
// ── Engine ──
class CircuitBreakerEngine {
    circuits = new Map();
    configs = new Map();
    persistence;
    constructor(persistence) {
        this.persistence = persistence ?? new persistence_1.JsonPersistence();
        this.loadState();
    }
    configure(key, config) {
        this.configs.set(key, config);
        this.saveConfigs();
    }
    act(key, action, now) {
        const ts = now ?? Date.now();
        const config = this.configs.get(key) ?? { failureThreshold: 5, cooldownMs: 30_000 };
        let entry = this.circuits.get(key);
        if (!entry) {
            entry = {
                state: "closed",
                failures: 0,
                successes: 0,
                lastFailureAt: 0,
                halfOpenAttempts: 0,
            };
            this.circuits.set(key, entry);
        }
        // Auto-transition: open -> half_open when cooldown expires
        if (entry.state === "open") {
            const elapsed = ts - entry.lastFailureAt;
            if (elapsed >= config.cooldownMs) {
                entry.state = "half_open";
                entry.halfOpenAttempts = 0;
                this.saveState();
            }
        }
        switch (action) {
            case "record_success":
                return this.recordSuccess(key, entry, config, ts);
            case "record_failure":
                return this.recordFailure(key, entry, config, ts);
            case "reset":
                return this.resetCircuit(key, entry, config, ts);
            case "status":
            default:
                return this.getStatus(key, entry, config, ts);
        }
    }
    recordSuccess(key, entry, config, now) {
        if (entry.state === "half_open") {
            entry.successes += 1;
            entry.halfOpenAttempts += 1;
            // Transition to closed after enough successes
            if (entry.halfOpenAttempts >= (config.halfOpenMaxAttempts ?? 1)) {
                entry.state = "closed";
                entry.failures = 0;
                entry.successes = 0;
                entry.halfOpenAttempts = 0;
            }
        }
        else if (entry.state === "closed") {
            entry.successes += 1;
            // Reset failure count on success
            entry.failures = 0;
        }
        this.saveState();
        return this.getStatus(key, entry, config, now);
    }
    recordFailure(key, entry, config, now) {
        entry.failures += 1;
        entry.lastFailureAt = now;
        if (entry.state === "half_open") {
            // Failure in half-open trips back to open
            entry.state = "open";
            entry.halfOpenAttempts = 0;
        }
        else if (entry.state === "closed" && entry.failures >= config.failureThreshold) {
            entry.state = "open";
            entry.halfOpenAttempts = 0;
        }
        this.saveState();
        return this.getStatus(key, entry, config, now);
    }
    resetCircuit(key, entry, config, now) {
        entry.state = "closed";
        entry.failures = 0;
        entry.successes = 0;
        entry.halfOpenAttempts = 0;
        entry.lastFailureAt = 0;
        this.saveState();
        return this.getStatus(key, entry, config, now);
    }
    getStatus(_key, entry, config, now) {
        const hints = [];
        let nextAttemptAt = null;
        let allowed = false;
        if (entry.state === "closed") {
            allowed = true;
            hints.push("Circuit is healthy — requests allowed");
        }
        else if (entry.state === "open") {
            const elapsed = now - entry.lastFailureAt;
            const remaining = config.cooldownMs - elapsed;
            if (remaining > 0) {
                nextAttemptAt = entry.lastFailureAt + config.cooldownMs;
                hints.push(`Circuit open — cooldown ${remaining}ms remaining`);
            }
            else {
                hints.push("Cooldown expired — transition to half-open on next request");
                allowed = true;
            }
        }
        else {
            // half_open
            allowed = true;
            const maxHalf = config.halfOpenMaxAttempts ?? 1;
            hints.push(`Half-open — ${entry.halfOpenAttempts}/${maxHalf} probe attempts used`);
        }
        return {
            state: entry.state,
            failures: entry.failures,
            successes: entry.successes,
            threshold: config.failureThreshold,
            cooldownMs: config.cooldownMs,
            nextAttemptAt,
            allowed,
            hints,
        };
    }
    loadState() {
        const saved = this.persistence.load("circuit_state", []);
        for (const [k, v] of saved) {
            this.circuits.set(k, v);
        }
        const savedConfigs = this.persistence.load("circuit_configs", []);
        for (const [k, v] of savedConfigs) {
            this.configs.set(k, v);
        }
    }
    saveState() {
        this.persistence.save("circuit_state", Array.from(this.circuits.entries()));
    }
    saveConfigs() {
        this.persistence.save("circuit_configs", Array.from(this.configs.entries()));
    }
}
exports.CircuitBreakerEngine = CircuitBreakerEngine;
//# sourceMappingURL=circuit.js.map