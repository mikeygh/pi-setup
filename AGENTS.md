# Global Project Knowledge

Lessons learned from coding projects. Updated as new insights emerge.

## Cryptography & Hashing

- **blake2b keyed mode**: Node.js `crypto.createHash('blake2b512', { key })` silently ignores the key parameter and produces incorrect hashes. Always use Python's `hashlib.blake2b(data, key=key)` for correct keyed blake2b. Verify against OpenSSL or Python reference when in doubt.

## Design Patterns

*(Add learnings here)*

## Anti-patterns to avoid

*(Add learnings here)*

## CLI & Tooling

*(Add learnings here)*
