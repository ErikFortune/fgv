# crypto-batch-2-misc — Completed

**Stream:** crypto-batch-2-misc  
**Completed:** 2026-05-12  
**Branch:** `claude/add-crypto-provider-methods-hHMYd`  
**PR target:** `claude/crypto-batch-2-features`

## Summary

Added five new methods to `ICryptoProvider` (and both concrete implementations) to complete the digital signing, HMAC authentication, and constant-time comparison surface:

| Method | Return | Notes |
|--------|--------|-------|
| `sign(privateKey, data)` | `Promise<Result<Uint8Array>>` | Ed25519 and ECDSA-P256; algorithm inferred from key |
| `verify(publicKey, signature, data)` | `Promise<Result<boolean>>` | Same algorithms; `false` on mismatch, `Failure` on invalid key type |
| `timingSafeEqual(a, b)` | `boolean` | Constant-time; browser: XOR-walk accumulator; Node: `crypto.timingSafeEqual` |
| `hmacSha256(key, data)` | `Promise<Result<Uint8Array>>` | HMAC-SHA256 MAC; key must be HMAC `CryptoKey` with `'sign'` usage |
| `verifyHmacSha256(key, signature, data)` | `Promise<Result<boolean>>` | Constant-time HMAC verification via `timingSafeEqual` |

`sign`/`verify`/`timingSafeEqual` were specified in the stream brief. `hmacSha256`/`verifyHmacSha256` were added per orchestrator review request (cross-repo consumer surfaced the need during implementation).

## Files changed

### Interface
- `libraries/ts-extras/src/packlets/crypto-utils/model.ts` — added 5 method signatures with JSDoc

### Implementations
- `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` — Node implementation + `signAlgorithmFromKey` helper
- `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` — Browser implementation + `signAlgorithmFromKey` helper

### Tests
- `libraries/ts-extras/src/test/unit/crypto/nodeCryptoProvider.signVerify.test.ts` — 30 tests (new file)
- `libraries/ts-web-extras/src/test/unit/browserCryptoProvider.signVerify.test.ts` — 31 tests (new file)

### Documentation
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — updated `crypto-utils` entry + sign/verify, HMAC, and AES decision shortcuts

### Build artifacts (auto-generated)
- `libraries/ts-extras/etc/ts-extras.api.md`
- `libraries/ts-web-extras/etc/ts-web-extras.api.md`

### Pre-existing fix (opportunistic)
- `libraries/ts-extras/src/packlets/crypto-utils/keystore/keyStore.ts` — fixed two `c8 ignore` annotation bugs causing false coverage gaps

## Pre-existing issues (not introduced by this stream)

1. **ts-extras global coverage threshold** — `ai-assist` packlet has several files below 100% coverage; this stream's code is 100% covered individually.
2. **ts-web-extras missing eslint.config.js** — `rushx lint` fails for the whole package; pre-existing infrastructure gap unrelated to new code.
