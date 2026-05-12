# Stream State: crypto-batch-2-misc

**Status:** ✅ implementation complete; pending PR merge
**Last updated:** 2026-05-12 (implementing agent)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| Implementation | ✅ complete | All five methods implemented and tested |
| PR | ✅ ready to merge | Review complete; all comments addressed |

---

## Decisions log

### Algorithm inference from key (not separate parameter)
Brief specified algorithm inferred from `CryptoKey.algorithm.name`. ECDSA keys store `name: 'ECDSA'` but not the hash; a helper `signAlgorithmFromKey` augments ECDSA with `hash: 'SHA-256'` at sign time. Return type is `AlgorithmIdentifier | EcdsaParams` (not bare `AlgorithmIdentifier`) to satisfy TypeScript's WebCrypto types.

### HMAC-SHA256 added per orchestrator review request
`hmacSha256` and `verifyHmacSha256` were not in the original brief; added in a follow-up commit after the orchestrator's first review surfaced a cross-repo consumer need (session-token MAC). `verifyHmacSha256` uses `timingSafeEqual` internally for constant-time comparison.

### Browser `timingSafeEqual` — XOR-walk with `eslint-disable no-bitwise`
Brief required constant-time XOR-walk accumulator with no early-return after length check. The `no-bitwise` ESLint rule fires on `diff |= a[i] ^ b[i]`. Used `// eslint-disable-next-line no-bitwise` (same established pattern as `keyStore.ts`).

### keyStore.ts pre-existing coverage annotation bugs
Found two bugs in the pre-existing `c8 ignore` annotations causing false coverage gaps in ts-extras:
1. Line ~1226: missing annotation before a defensive `if (keystoreFile === undefined)` — added with rationale.
2. Line ~1348: multi-line comment body miscounting `next 3`; converted to single-line so the count is correct.

### JSDoc @link resolution
API Extractor resolves `{@link X}` as a package export, not a member. Links within an interface require fully-qualified form: `{@link ICryptoProvider.hmacSha256}` rather than `{@link hmacSha256}`. Concrete-class links use class-qualified form: `{@link NodeCryptoProvider.sign}`, `{@link BrowserCryptoProvider.sign}`.

---

## Open questions / blockers

### Pre-existing: ts-extras global coverage threshold fails
`rushx test` in `ts-extras` fails the global threshold due to coverage gaps in `ai-assist` packlet files not touched by this stream. This stream's new code has 100% coverage individually.

### Pre-existing: ts-web-extras missing eslint.config.js
`rushx lint` in `ts-web-extras` fails — no config file exists for this package. Pre-existing infrastructure gap.

---

## PR

https://github.com/ErikFortune/fgv/pull/345 — target: `claude/crypto-batch-2-features`
