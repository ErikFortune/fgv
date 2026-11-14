[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / generateUuid

# Function: generateUuid()

> **generateUuid**(): [`Uuid`](../type-aliases/Uuid.md)

Generates a cryptographically random UUIDv4 using the platform's Web Crypto
API (`globalThis.crypto.randomUUID`). Works in Node.js \>= 18 and modern
browsers without per-call runtime checks.

## Returns

[`Uuid`](../type-aliases/Uuid.md)

A new [Uuid](../type-aliases/Uuid.md).

## Throws

An `Error` if the runtime does not expose `globalThis.crypto.randomUUID`.
This indicates an unsupported platform, not a per-call failure mode, so it is
surfaced as a thrown error rather than a `Result`.
