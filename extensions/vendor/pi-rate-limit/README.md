# pi-rate-limit

> Pi-native runtime resilience toolkit — rate limiting, retry/backoff planning, and circuit-breaker state tracking for pi.dev extensions.

## Installation

```bash
pi install npm:pi-rate-limit
```

## What It Does

pi-rate-limit gives pi.dev extension developers three essential runtime resilience primitives:

1. **Rate Limiting** — Token bucket and sliding window policies to throttle tool/provider calls
2. **Retry Planning** — Deterministic exponential backoff with jitter, max attempts, and error classification
3. **Circuit Breakers** — Closed/open/half-open state machines to protect against cascading failures

All tools are deterministic, in-memory, and optionally persistent via JSON files. No LLM calls. Integrates conceptually with pi-log, pi-config, pi-perf, and pi-token-router.

## Tools

### `rate_limit_check`

Evaluate whether a named tool/provider/action is allowed under a configured rate-limit policy. Supports token bucket (capacity + refill rate) and sliding window (limit + window duration) algorithms.

**Parameters:**
- `key` (string, required) — Named key for the policy
- `action` (string) — `check` | `add_policy` | `remove_policy` | `reset` (default: `check`)
- `algorithm` (string) — `token_bucket` | `sliding_window` (required for `add_policy`)
- `capacity` (number) — Token bucket capacity
- `refillRate` (number) — Tokens per second
- `limit` (number) — Max requests per window
- `windowMs` (number) — Window duration in ms
- `consume` (boolean) — Whether to consume a token on check (default: `true`)

**Example:**
```
Add a token bucket policy for "openai" with capacity 60 and refill rate 1/sec,
then check if a request is allowed.
```

### `retry_plan`

Generate a deterministic retry/backoff plan for a failed action. Supports exponential backoff with configurable base delay, multiplier, jitter strategies (none/full/equal), and retryable error classification.

**Parameters:**
- `attempt` (number, required) — Current attempt number
- `maxAttempts` (number, required) — Maximum number of attempts
- `baseDelayMs` (number, required) — Base delay in milliseconds
- `multiplier` (number) — Backoff multiplier (default: `2`)
- `maxDelayMs` (number) — Maximum delay cap in ms (default: `30000`)
- `jitter` (object) — `{ type: "none"|"full"|"equal", seed?: number }`
- `retryableErrors` (string[]) — List of retryable error class names
- `errorCode` (string) — Error code to check
- `errorMessage` (string) — Error message to check

**Example:**
```
Generate a retry plan for attempt 2 of 5, with 1000ms base delay and full jitter.
```

### `circuit_status`

Track and report circuit-breaker state (closed/open/half-open) for a named tool/provider. Record successes and failures, check current status, configure thresholds, or manually reset.

**Parameters:**
- `key` (string, required) — Named key for the circuit
- `action` (string) — `record_success` | `record_failure` | `status` | `reset` (default: `status`)
- `configure` (boolean) — Set to true to (re)configure the circuit
- `failureThreshold` (number) — Failures to trip circuit (default: `5`)
- `cooldownMs` (number) — Cooldown duration in ms (default: `30000`)
- `halfOpenMaxAttempts` (number) — Probe attempts in half-open (default: `1`)
- `now` (number) — Deterministic timestamp for testing

**Example:**
```
Configure a circuit breaker for "anthropic" with threshold 3 and 60s cooldown,
then record a failure and check the status.
```

## Resources

- [npm](https://www.npmjs.com/package/pi-rate-limit)
- [GitHub](https://github.com/ZachDreamZ/pi-rate-limit)
- [pi.dev](https://pi.dev/packages/pi-rate-limit)

## License

MIT
