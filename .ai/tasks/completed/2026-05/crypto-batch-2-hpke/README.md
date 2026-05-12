# Stream: crypto-batch-2-hpke

**Status:** Completed 2026-05  
**Work branch:** `claude/crypto-batch-2-hpke-impl-pR3QU`  
**PR target:** `claude/crypto-batch-2-features`

---

## What was delivered

`HpkeProvider` — HPKE base mode (RFC 9180) for `@fgv/ts-extras`:

- **Cipher suite:** DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM
- **API:** Class-based factory pattern matching the existing `NodeCryptoProvider` / `BrowserCryptoProvider` / `KeyStore` shape
- **Public surface:** `sealBase`, `openBase`, `hkdf`, `encodeEnvelope`, `decodeEnvelope`
- **Cross-runtime:** Single implementation in `ts-extras`; re-exported from `ts-web-extras` for browser callers
- **Runtime requirements:** Node 20+; Chrome 113+, Safari 16.4+, Firefox 118+

### Files added / modified

| File | Change |
|---|---|
| `libraries/ts-extras/src/packlets/crypto-utils/hpkeProvider.ts` | New — full implementation |
| `libraries/ts-extras/src/packlets/crypto-utils/index.ts` | Export HpkeProvider, IHpkeSealResult |
| `libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts` | Export HpkeProvider, IHpkeSealResult |
| `libraries/ts-extras/src/test/unit/crypto/hpke-test-vectors.ts` | Shared test vectors (RFC 5869 + self-generated cross-runtime anchors) |
| `libraries/ts-extras/src/test/unit/crypto/hpkeProvider.test.ts` | Node.js tests (24 tests, 100% coverage) |
| `libraries/ts-web-extras/src/packlets/crypto-utils/index.ts` | Re-export HpkeProvider via CryptoUtils namespace |
| `libraries/ts-web-extras/src/test/unit/hpkeProvider.test.ts` | Browser tests (18 tests, cross-runtime anchor validation) |
| `.ai/instructions/LIBRARY_CAPABILITIES.md` | HpkeProvider entry + decision shortcuts |

---

## Key decisions

| Decision | Rationale |
|---|---|
| Class `HpkeProvider` (private ctor + `static create(subtle)`) | Matches fgv factory pattern: `NodeCryptoProvider`, `BrowserCryptoProvider`, `KeyStore`, `DirectEncryptionProvider` |
| `SubtleCrypto` captured at construction | Test injection trivial; no per-call overhead |
| `encodeEnvelope`/`decodeEnvelope` as static methods on class | Avoids `@typescript-eslint/no-namespace` lint; TypeScript class merges value+type |
| `"eae_prk"` label in ExtractAndExpand (B.0 correction) | RFC 9180 §4.1 uses `"eae_prk"`, not `"dh"` as design.md §1 stated — confirmed via OpenSSL happykey source and multiple independent implementations |
| `_toBufferView` on all `SubtleCrypto` inputs | TypeScript 5.x strict `Uint8Array<ArrayBuffer>` vs `Uint8Array<ArrayBufferLike>` — Web Crypto API rejects the latter; copy pattern from `browserCryptoProvider.ts` |
| Self-generated cross-runtime anchors for test vectors | RFC 9180 Appendix A has no DHKEM(X25519)+AES-256-GCM vectors; A.1 covers X25519+AES-128-GCM only |
| Re-export via `CryptoUtils.HpkeProvider` not `@fgv/ts-extras/crypto` subpath | `moduleResolution: node` (the monorepo rig default) doesn't resolve `exports` field subpaths; top-level namespace import is backward-compatible |

---

## Artifacts preserved

- `design.md` — Phase A design (note: uses "dh" label in §1 which was corrected in B.0)
- `state.md` — Full decision log including B.0 discrepancy resolution
- `brief.md` — Phase A brief
- `brief-phase-b.md` — Phase B implementation contract
