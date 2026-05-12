# Stream State: crypto-batch-2-hpke

**Status:** 🟢 phase A signed off; phase B ready to start
**Last updated:** 2026-05-12 (orchestrator — phase B brief authored)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ done | design.md merged into `claude/crypto-batch-2-features` |
| B — implementation | 🟢 ready | `brief-phase-b.md` is the binding contract; assignable to implementing agent |

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
| Namespace `Hpke` (PascalCase) | Matches existing `KeyStore`, `Converters` namespace casing; RFC acronym HPKE would be inconsistent |
| Functions take `SubtleCrypto` as first param | Decouples from `ICryptoProvider` (D1); enables single implementation for both Node and browser without code duplication; Node passes `crypto.webcrypto.subtle`, browser passes `globalThis.crypto.subtle` |
| `{ enc, ciphertext }` output — ciphertext includes GCM auth tag | Matches RFC 9180 AEAD output convention and Web Crypto AES-GCM behavior; splitting tag is unnecessary complexity |
| HKDF as `Hpke.hkdf` (option b) | Keeps `ICryptoProvider` lean; HKDF is naturally associated with HPKE; promotion to `ICryptoProvider` is forward-compatible |
| `encodeEnvelope`/`decodeEnvelope` helpers included | Consumer use cases transport enc+ciphertext as a unit; enc is always 32 bytes for X25519 so the split is unambiguous |
| No lower-level primitives exposed | Prevents caller misuse of encap/decap/key_schedule; promote if genuinely needed |
| No fgv helper for canonical `info` construction | Application-specific; premature abstraction |
| `info` typed as `Uint8Array`, not string | Matches RFC 9180, existing `IWrapBytesOptions.info`, avoids implicit encoding |
| HPKE module in `ts-extras` only, no separate browser implementation | Both Node 20+ and browsers expose identical `SubtleCrypto`; single implementation serves both; browser consumers get it via `ts-web-extras` re-export |

---

## Open questions / blockers

| ID | Question | Impact | Status |
|---|---|---|---|
| Q1 | RFC 9180 test vectors for exact cipher suite (DHKEM(X25519)+HKDF-SHA256+AES-256-GCM) may not exist in Appendix A | Cross-runtime correctness anchor; mitigated by self-generated vectors approach | ⚠️ Phase B agent must verify at rfc-editor.org |
| Q2 | `{ enc, ciphertext }` vs `{ enc, ciphertext, tag }` — design uses inclusive ciphertext | Wire format compatibility with consumer | 🔵 Confirm at signoff or proceed |
| Q3 | Browser platform version floor (Chrome 113+, Safari 16.4+, Firefox 118+ for X25519) | Documentation only; no implementation impact | ⏸ Phase B to document in LIBRARY_CAPABILITIES.md |
| Q4 | WebAuthn stream may need `ICryptoProvider.hkdf` vs `Hpke.hkdf` | Interface design coordination | 🔵 Confirm at orchestrator-level before phase B of either stream |

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
