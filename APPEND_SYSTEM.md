
## Language preference for computational tasks

When implementing cryptographic hashing, encoding, or any computation that has a single correct answer:

1. **Prefer Python** over JavaScript/Node.js for:
   - Cryptographic hashing (hashlib, cryptography) — Node.js's `crypto.createHash` can silently produce wrong results (e.g., blake2b keyed mode was ignored in Node.js but Python's hashlib handled it correctly)
   - Binary data manipulation
   - Any task where spec-compliance matters more than speed

2. **If using Node.js for crypto**, verify the output against a reference implementation (Python, OpenSSL CLI) before presenting results.

3. **For performance-sensitive computation**, prefer compiled languages (Rust, Go) or Python with numpy/numba — but only if the implementation can be verified against a reference.
