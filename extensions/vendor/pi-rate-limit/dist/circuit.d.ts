import { JsonPersistence } from "./persistence";
export type CircuitState = "closed" | "open" | "half_open";
export type CircuitAction = "record_success" | "record_failure" | "status" | "reset";
export interface CircuitConfig {
    failureThreshold: number;
    cooldownMs: number;
    halfOpenMaxAttempts?: number;
}
export interface CircuitResult {
    state: CircuitState;
    failures: number;
    successes: number;
    threshold: number;
    cooldownMs: number;
    nextAttemptAt: number | null;
    allowed: boolean;
    hints: string[];
}
export declare class CircuitBreakerEngine {
    private circuits;
    private configs;
    private persistence;
    constructor(persistence?: JsonPersistence);
    configure(key: string, config: CircuitConfig): void;
    act(key: string, action: CircuitAction, now?: number): CircuitResult;
    private recordSuccess;
    private recordFailure;
    private resetCircuit;
    private getStatus;
    private loadState;
    private saveState;
    private saveConfigs;
}
//# sourceMappingURL=circuit.d.ts.map