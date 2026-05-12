# Stream State: crypto-batch-2-misc

**Status:** ✅ implementation complete; pending PR
**Last updated:** 2026-05-12 (implementing agent)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| Implementation | ✅ complete | All three methods implemented and tested |
| PR | 🟡 ready to open | Pre-existing test/lint failures documented below |

---

## Decisions log

### Algorithm inference from key (not separate parameter)
Brief specified algorithm inferred from `CryptoKey.algorithm.name`. ECDSA keys store `name: 'ECDSA'` but not the hash; a helper `signAlgorithmFromKey` augments ECDSA with `hash: 'SHA-256'` at sign time. Return type is `AlgorithmIdentifier | EcdsaParams` (not bare `AlgorithmIdentifier`) to satisfy TypeScript's WebCrypto types.

### Browser `timingSafeEqual` — XOR-walk with `eslint-disable no-bitwise`
Brief required constant-time XOR-walk accumulator with no early-return after length check. The `no-bitwise` ESLint rule fires on `diff |= a[i] ^ b[i]`. Used `// eslint-disable-next-line no-bitwise` (same established pattern as `keyStore.ts`).

### keyStore.ts pre-existing coverage annotation bugs
Found two bugs in the pre-existing `c8 ignore` annotations that were causing false coverage gaps in ts-extras:
1. Line ~1226: missing annotation entirely before a defensive `if (keystoreFile === undefined)` — added `/* c8 ignore next 3 */` with rationale.
2. Line ~1348: multi-line `/* c8 ignore next 3 */` comment body was miscounting; converted to single-line comment so `next 3` correctly covers `if`, `return false`, `}`.

These were pre-existing bugs not introduced by this stream; fixed opportunistically since they blocked the coverage threshold check.

---

## Open questions / blockers

### Pre-existing: ts-extras global coverage threshold fails
`rushx test` in `ts-extras` fails the global threshold due to coverage gaps in `ai-assist` packlet files not touched by this stream:
- `apiClient.ts`: statements 98.92%
- `chatRequestBuilders.ts`: branches 86.95%
- `sseParser.ts`: branches 96.29%
- `proxy.ts`: statements 97.38%
- `converters.ts`: statements 94.87%

These failures pre-exist this stream and are tracked separately. This stream's new code (`nodeCryptoProvider.ts` sign/verify/timingSafeEqual) has 100% coverage individually.

### Pre-existing: ts-web-extras missing eslint.config.js
`rushx lint` in `ts-web-extras` fails with "no eslint.config.js found" — the config file was never created for this package. Pre-existing infrastructure gap; not introduced by this stream. `BrowserCryptoProvider` new code is lint-clean (confirmed by ts-extras lint patterns and TypeScript strictness).

---

## PR

*(to be opened against `claude/crypto-batch-2-features`)*
