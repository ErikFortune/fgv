# Stream State: crypto-batch-2-hpke

**Status:** 🟢 phase A signed off; phase B ready to start
**Last updated:** 2026-05-12 (orchestrator — phase B brief authored)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ done | design.md merged into `claude/crypto-batch-2-features` |
| B — implementation | 🟡 in progress | B.0 complete (discrepancy found and resolved); B.1–B.6 in progress |

---

## Phase A signoff summary (orchestrator)

Design approved with **one significant modification**: the design's "subtle as first parameter" function-based API is replaced with a **class-based `HpkeProvider` pattern** (private constructor + static `create(subtle): Result<HpkeProvider>`), matching the existing `NodeCryptoProvider` / `BrowserCryptoProvider` / `KeyStore` / `DirectEncryptionProvider` shape. The rest of the design (cipher suite; ciphertext format with inclusive auth tag; HKDF placement on the class rather than `ICryptoProvider`; `info` as first-class `Uint8Array`; internal primitives stay internal; no context-binding helper; cross-runtime via re-export with shared test vectors) stands as designed.

Orchestrator added one non-optional precondition (B.0): live RFC 9180 verification. The phase A agent's research session was rfc-editor.org-blocked, so phase B must verify algorithm pseudocode and test-vector availability before encoding constants.

Phase B contract is baked into `.ai/tasks/active/crypto-batch-2-hpke/brief-phase-b.md`. Where the brief conflicts with the design, the brief wins.

---

## Work branch

`claude/implement-hpke-base-mode-7Gmo8` → PR target: `claude/crypto-batch-2-features`

---

## Decisions log

| Decision | Rationale |
|---|---|
| Class `HpkeProvider` (brief D2 override) | Matches existing fgv pattern: `NodeCryptoProvider`, `BrowserCryptoProvider`, `KeyStore`, `DirectEncryptionProvider` — all classes with `create` factories. Brief overrides design's function-based API. |
| `SubtleCrypto` captured at construction | Matches class-based pattern; no per-call cognitive overhead; test injection trivial |
| `{ enc, ciphertext }` output — ciphertext includes GCM auth tag | Matches RFC 9180 AEAD output convention and Web Crypto AES-GCM behavior; splitting tag is unnecessary complexity |
| HKDF as `HpkeProvider.hkdf(...)` | Keeps `ICryptoProvider` lean; HKDF is naturally associated with HPKE; promotion to `ICryptoProvider` is forward-compatible (D4) |
| `encodeEnvelope`/`decodeEnvelope` as namespace on class | Consumer use cases transport enc+ciphertext as a unit; enc is always 32 bytes for X25519 so the split is unambiguous; namespace merge with class is idiomatic TypeScript |
| No lower-level primitives exposed (D7) | Prevents caller misuse of encap/decap/key_schedule; promote if genuinely needed |
| No fgv helper for canonical `info` construction (D8) | Application-specific; premature abstraction |
| `info` typed as `Uint8Array`, not string | Matches RFC 9180, existing `IWrapBytesOptions.info`, avoids implicit encoding (D5) |
| HPKE implementation in `ts-extras` only, re-export from `ts-web-extras` | Both Node 20+ and browsers expose identical `SubtleCrypto`; single implementation serves both (D6) |
| **B.0 DISCREPANCY RESOLVED: `"eae_prk"` label** | design.md §1 had `"dh"` as the LabeledExtract label in ExtractAndExpand. RFC 9180 §4.1 uses `"eae_prk"`. Confirmed by OpenSSL happykey implementation, web search pseudocode, and multiple independent HPKE implementations. design.md was drawn from training corpus without live RFC access. Orchestrator approved correction on 2026-05-12. Implementation uses RFC-correct `"eae_prk"`. |
| **B.0: RFC test vectors** | RFC 9180 Appendix A has NO test vectors for DHKEM(X25519)+AES-256-GCM. A.1 covers X25519+AES-128-GCM; A.6 covers P-521+AES-256-GCM. Using design §6 mitigation: self-generated cross-runtime anchors from Node implementation, shared with ts-web-extras tests. RFC A.1 vectors validate KEM internals (shared_secret uses same kem_suite_id). |
| `atob` for JWK base64url decode | Node 20+ and modern browsers both expose `atob` as global. Avoids Node-specific `Buffer` import in hpkeProvider.ts; needed to extract recipient public key bytes from JWK `x` field in Decap. |

---

## Open questions / blockers

| ID | Question | Impact | Status |
|---|---|---|---|
| Q1 | RFC 9180 test vectors for exact cipher suite (DHKEM(X25519)+HKDF-SHA256+AES-256-GCM) may not exist in Appendix A | Cross-runtime correctness anchor; mitigated by self-generated vectors approach | ✅ Resolved in B.0: confirmed no AES-256-GCM vectors for X25519 in RFC Appendix A. Using self-generated cross-runtime anchors per design §6 mitigation. |
| Q2 | `{ enc, ciphertext }` vs `{ enc, ciphertext, tag }` — design uses inclusive ciphertext | Wire format compatibility with consumer | ✅ Resolved in brief: D3 confirms inclusive ciphertext. |
| Q3 | Browser platform version floor (Chrome 113+, Safari 16.4+, Firefox 118+ for X25519) | Documentation only; no implementation impact | ✅ Documented in LIBRARY_CAPABILITIES.md (B.5). |
| Q4 | WebAuthn stream may need `ICryptoProvider.hkdf` vs `Hpke.hkdf` | Interface design coordination | 🔵 Deferred: hkdf stays on HpkeProvider per D4. |

---

## Research notes

- **RFC 9180 access blocked:** rfc-editor.org returned HTTP 403 during this session. Protocol details are from agent training corpus. Phase B agent must verify against the authoritative RFC before writing code.
- **Test vectors for exact cipher suite uncertain:** `cfrg/draft-irtf-cfrg-hpke` master-branch test-vectors.json only contains entries with AES-128-GCM for X25519. RFC 9180 Appendix A may not include DHKEM(X25519)+AES-256-GCM vectors. Design §6 documents the mitigation: use A.1 vectors for KEM+KDF validation; generate composite vectors from Node implementation for cross-runtime anchor.
- **No external dependency needed:** All required Web Crypto primitives (X25519, HMAC-SHA256, AES-256-GCM) are native in Node 20+ and modern browsers. The HKDF labeled-extract/labeled-expand requirement to call Extract and Expand separately is satisfied via HMAC-SHA256 directly, a standard pattern for RFC 9180 Web Crypto implementations.
- **Decap public-key recovery:** RFC 9180 Decap requires the recipient's own public key bytes. Web Crypto has no `getPublicKey(privateKey)` API. The implementation extracts it via JWK export of the private key and reading the `x` field. Design appendix documents this.

## Excluded from design

- HPKE auth mode, PSK mode, auth-PSK mode (out of scope per brief)
- Multi-message / stateful HPKE context (seq counter management) — single-message seal/open is the correct scope for the consumer's use cases
- Higher-level abstraction over HPKE and ECIES (per D1)
- `ICryptoProvider.hkdf` — deferred to follow-on stream if demand materializes (see §4)

---

## Recommendation summary (for orchestrator presentation)

The design proposes a standalone `Hpke` namespace in `@fgv/ts-extras/crypto-utils`, implemented as a `SubtleCrypto`-parameterized module with no Node-specific imports — enabling the same code to serve both Node and browser consumers. The namespace exports `sealBase`, `openBase`, `hkdf`, `encodeEnvelope`, and `decodeEnvelope`. The HKDF-SHA256 primitive is exposed from the `Hpke` namespace (not `ICryptoProvider`), keeping the provider interface lean. The `info` parameter is `Uint8Array` and explicitly first-class with no default. Cross-runtime correctness testing follows the existing `wrapBytes` pattern: RFC 9180 test vectors (or self-generated alternatives) shared between ts-extras and ts-web-extras Jest suites, both running under Node 20+ Web Crypto. One notable uncertainty: RFC 9180 Appendix A may not include test vectors for the exact DHKEM(X25519)+AES-256-GCM combination; the design documents a mitigation strategy but the phase B agent must verify at the authoritative RFC URL.

---

## PR

PR open: `claude/implement-hpke-base-mode-7Gmo8` → `claude/crypto-batch-2-features`
Contains: `.ai/tasks/active/crypto-batch-2-hpke/design.md` + updated `state.md`
