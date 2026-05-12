# crypto-batch-2-misc — Completed

**Stream:** crypto-batch-2-misc  
**Completed:** 2026-05-12  
**Branch:** `claude/add-crypto-provider-methods-hHMYd`  
**PR target:** `claude/crypto-batch-2-features`

## Summary

Added three new methods to `ICryptoProvider` (and both concrete implementations) to complete the digital signing and constant-time comparison surface:

| Method | Return | Notes |
|--------|--------|-------|
| `sign(privateKey, data)` | `Promise<Result<Uint8Array>>` | Ed25519 and ECDSA-P256; algorithm inferred from key |
| `verify(publicKey, signature, data)` | `Promise<Result<boolean>>` | Same algorithms; `false` on mismatch, `Failure` on invalid key type |
| `timingSafeEqual(a, b)` | `boolean` | Constant-time; browser: XOR-walk accumulator; Node: `crypto.timingSafeEqual` |

## Files changed

### Interface
- `libraries/ts-extras/src/packlets/crypto-utils/model.ts` — added 3 method signatures with JSDoc

### Implementations
- `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` — Node implementation + `signAlgorithmFromKey` helper
- `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` — Browser implementation + `signAlgorithmFromKey` helper

### Tests
- `libraries/ts-extras/src/test/unit/crypto/nodeCryptoProvider.signVerify.test.ts` — 23 tests (new file)
- `libraries/ts-web-extras/src/test/unit/browserCryptoProvider.signVerify.test.ts` — 24 tests (new file)

### Documentation
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — updated `crypto-utils` entry + new decision shortcuts

### Build artifacts (auto-generated)
- `libraries/ts-extras/etc/ts-extras.api.md`
- `libraries/ts-web-extras/etc/ts-web-extras.api.md`

### Pre-existing fix (opportunistic)
- `libraries/ts-extras/src/packlets/crypto-utils/keystore/keyStore.ts` — fixed two `c8 ignore` annotation bugs that were causing false coverage gaps

## Pre-existing issues (not introduced by this stream)

1. **ts-extras global coverage threshold** — `ai-assist` packlet has several files below 100% coverage; this stream's code is 100% covered individually.
2. **ts-web-extras missing eslint.config.js** — `rushx lint` fails for the whole package; pre-existing infrastructure gap unrelated to new code.
