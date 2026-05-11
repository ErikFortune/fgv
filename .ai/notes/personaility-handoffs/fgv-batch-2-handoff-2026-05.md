# fgv batch 2 — auth primitives handoff

**From:** personaility project orchestrator
**To:** fgv project orchestrator
**Date:** 2026-05-11
**Status:** scoped; awaits user maintainer-policy decisions on Q2 + Q3 before implementation kickoff.

> **Archive note (fgv orchestrator, 2026-05-11):** This brief was hand-delivered via chat from the personaility orchestrator (cross-repo MCP scope didn't permit direct read of the personaility repo). Archived here verbatim so future fgv orchestrators have the originating context checked in. Decisions taken on Q2/Q3/Q7 plus the additional Q1 surface decision are captured in the substrate-prep commit and in the per-stream `state.md` files for the four resulting streams: `crypto-batch-2-hpke`, `crypto-batch-2-argon2id`, `crypto-batch-2-webauthn`, `crypto-batch-2-misc`.

---

## What personaility is, briefly

Personaility is an AI-mediated communication platform built on the `@fgv/*` library family. Users (humans) chat with personalities (AI agents) on a "hub" — the unit of deployment. Hubs federate (in the long arc); v1 is single-hub. The platform has a substantial auth / identity / cryptographic-trust arc that consumes several fgv primitives.

Batch 1 already shipped in `5.1.0-26` (X25519 keypair support, `Hash.Normalizer` RFC 8785 `canonicalize()` extension, bidirectional multibase/SPKI encoding helpers, `LIBRARY_CAPABILITIES.md` updates). This brief covers batch 2.

You and the personaility-side orchestrator have established a cross-repo coordination pattern over batch 1. This brief is written in that established shape — orchestrator-to-orchestrator, not implementer-precise. You decide phase shape, kick off implementing agents on the fgv side, surface up to the user when you need maintainer-policy decisions; the personaility side consumes the published primitives when they land.

Note on access constraint: the personaility repo is private and not reachable from fgv-side tooling. This brief is self-contained — context that would normally be cross-referenced is inlined below.

---

## Strategic context — why these primitives, what consumes them, when

Personaility's auth arc has two phases:

- **Phase 1 (v1 auth)** — passphrase-based credentials; single-hub multi-human; PBKDF2-derived keystore masters; HMAC-signed cookie sessions; hub-keystore-only BYOK provider keys. Does NOT need batch 2. Implementation stream is unblocked by `5.1.0-26` and starts soon.
- **Phase 2 (η-v2 implementation)** — WebAuthn-PRF as default credential with passphrase fallback; Argon2id key derivation; HPKE-wrapped per-conversation BYOK; recovery rows; federation-push primitive; cross-hub agent flows. Needs batch 2 in full.

η-v2 is the architectural target the personaility-side has converged on after multiple iterations + antagonist review rounds. Key architectural commitments relevant to batch 2:

- Each actor (human, agent, hub) has an Ed25519 signing keypair + X25519 encryption keypair. Calling cards are self-signed (Attestation primitive over JCS-canonical-JSON-encoded payload, using the `Hash.Normalizer.canonicalize()` shipped in batch 1).
- Each user's keystore (signing key, encryption key, BYOK provider keys) lives encrypted at rest on the user's home hub. The user unlocks it via WebAuthn-PRF (default daily credential) OR a typed credential (passphrase or 256-bit BIP39 recovery phrase, depending on threat-model posture).
- At unlock under α/η (the "α at home" half of model η), the user-keystore master is HPKE-wrapped to the home hub's `encryption:self` X25519 pubkey and delivered to the home hub server-side; the home hub holds the unlocked keystore in memory bounded by the session lifetime.
- Per-conversation BYOK delivery: when a user opens a session with an agent, any provider keys the user supplies are HPKE-wrapped to the recipient agent's `encryption:self` and stored against that conversation only.
- Recovery rows in the user's credential table: 256-bit BIP39 phrase → Argon2id-derived key → unwraps an alternate-master copy of the keystore master. The phrase is high-entropy because it's machine-generated, not user-typed.
- Federation-push primitive (deferred-of-deferred): hub-keypair-signed messages propagate revocation / key rotation / calling-card updates between peer hubs.

**Timing pressure is low.** Phase 1 hasn't shipped yet (5-10 day estimated stream); phase 2 begins after phase 1 stabilizes (additional weeks). Batch 2 can run on your capacity over the next month or two.

**Exception**: Argon2id has slight earlier pull. Even though v1 ships without recovery rows (passphrase only), if phase 1 grows to include recovery rows as a polish addition, Argon2id arrives sooner.

**HPKE has the latest pull** — needed at the phase-2 step where BYOK becomes per-conversation rather than hub-keystore-only.

---

## The six items

### Item 1 — HPKE base mode (RFC 9180)

**What:** standard HPKE base mode with:
- KEM: `DHKEM(X25519, HKDF-SHA256)`
- KDF: `HKDF-SHA256`
- AEAD: `AES-256-GCM` (id `0x0002`)

Entry points:
- `SealBase(pkR, info, aad, plaintext) → (enc, ct, tag)` — sender side; pkR is recipient X25519 pubkey; info is a context-binding string; aad is integrity-protected but not encrypted.
- `OpenBase(skR, info, aad, enc, ct, tag) → plaintext` — recipient side.

The `info` parameter is load-bearing for security in personaility's use: it binds each wrap to a specific context (session id, conversation id, etc.) so a captured ciphertext cannot be replayed in a different context. This must be a first-class parameter, not a fixed empty string.

**Consumers in personaility (phase 2):**

1. **BYOK delivery — per-conversation provider keys.** When user-A opens a session with agent-B (potentially on a different hub), user-A can supply their own provider API key (e.g., Anthropic) for that session's reasoning brain. The key is HPKE-sealed to agent-B's `encryption:self` X25519 pubkey, with `info` bound to the conversation id. Recipient hub opens the wrap on session-open; cost lands on user-A's provider account; agent-B's home hub doesn't see the raw key.

2. **Session-master-wrap.** At user unlock (η-v2 §3 / §4.2), the user's client derives the keystore master from their credential (WebAuthn-PRF or Argon2id-from-phrase), then HPKE-seals the master to the home hub's `encryption:self` pubkey for delivery. The hub stores the unlocked master in memory bounded by session lifetime; zeroed on session end. Replay protection comes from `info` binding to the session-establish challenge.

3. **Recovery-proof envelopes.** Each user's credential table includes a recovery row: a wrapped alternate-master encrypted under an Argon2id-derived key from a 256-bit BIP39 phrase the user wrote down at enrollment. The wrap itself uses HPKE in some shape (final shape pending v2 design pause).

4. **Cross-hub material delivery (federation, post-batch-2).** When the federation arc lands, hub-to-hub envelope wrapping (e.g., calling-card updates, signed claims) uses HPKE to the destination hub's `encryption:self` pubkey.

**Q1 — surface decision (maintainer call):**

- **(a)** Extend the existing `wrapBytes` / `unwrapBytes` API to accept HPKE as a new option within the same surface.
- **(b)** Introduce a separate `HPKE` namespace in `@fgv/ts-extras` (and `@fgv/ts-web-extras` for the browser side), leaving `wrapBytes` / `unwrapBytes` as the ECIES-specific primitive.

Current `wrapBytes` / `unwrapBytes` is ECIES over P-256. HPKE is a different primitive: different curve (X25519), different KDF wiring (HKDF as protocol-level), different AEAD parameterization, explicit `info` binding. Mixing them under one API may be ergonomically awkward; separating avoids confusion. Your call on the surface.

**Magnitude:** large. Multi-step protocol; both Node and browser implementations needed (the design requires client-side seal + server-side open under α/η).

### Item 2 — Argon2id

**What:** standard Argon2id key derivation (RFC 9106). Function shape roughly:


```
argon2id(password: Uint8Array | string,
         salt: Uint8Array,
         params: { memoryKiB, iterations, parallelism, outputBytes })
  → Uint8Array (derived bytes)
```


The deployed parameters need to be calibrated for the personaility threat model; defaults like OWASP recommendation (memoryKiB ≈ 19456, iterations ≈ 2, parallelism = 1, outputBytes = 32) are a reasonable starting point.

**Consumers in personaility (phase 2):**

1. **Recovery rows in η-v2's credential table.** Each user can enroll a 256-bit BIP39 recovery phrase at credential setup. The phrase → Argon2id → derived key → unwraps an alternate-master copy in the credential table's recovery row. Because the phrase is machine-generated and high-entropy (256 bits), it doesn't require the same KDF strength as a user-typed password — but Argon2id is still the right choice for the memory-hardness property against precomputation. This applies regardless of whether hybrid auth (WebAuthn-PRF + passphrase fallback) ships.

2. **Passphrase rows in η-v2's hybrid auth (if shipped).** If hybrid auth lands per the ergonomics findings (passphrase as fallback for users on platforms where WebAuthn-PRF isn't available, or for cross-browser dev workflows), the passphrase → Argon2id → master path replaces v1's PBKDF2. Higher entropy floor required because passphrases are user-typed.

**Q2 — maintainer-policy decision (yours to make in fgv-maintainer hat):**

- **(a)** fgv owns Argon2id. `NodeCryptoProvider.argon2id` wraps `argon2` (or `@node-rs/argon2`). `BrowserCryptoProvider.argon2id` bundles a WASM Argon2 implementation (e.g., `argon2-browser` or freshly compiled wasm-pack). Unified interface across runtimes; consumers don't think about implementation.

- **(b)** fgv explicitly declares Argon2id outside scope. Consumers reach for `argon2` / `@node-rs/argon2` directly with explicit acknowledgment (personaility will add a `TRUST.md`-equivalent note that Argon2id is application-level). Browser side gets its own WASM bundling concern.

**Cost asymmetry between options:**

- (a) puts the WASM bundling concern in `@fgv/ts-web-extras`: meaningful bundle size addition (~200-400 KB for an Argon2 WASM), version-pinning concerns across runtimes, the cross-runtime-output-equivalence test surface (Node `argon2` vs browser WASM must produce identical outputs for identical inputs, or the recovery-row use case breaks across browser-vs-server unwrap).
- (b) duplicates the "which Argon2 implementation" choice across consumers, but keeps fgv's runtime-bundling story simple.

This is a real maintainer-scope question, not a technical preference. The personaility side accepts either answer: (a) gives consumers a cleaner API; (b) gives consumers more flexibility. Tell the user (in fgv-maintainer hat) what you'd lean toward and why; user decides; you implement.

**Magnitude:** medium if (a); near-zero if (b).

### Item 3 — WebAuthn primitives

**What:** server-side and client-side primitives for the WebAuthn-PRF unlock ceremony.

**Server-side** primitives needed:
- Registration: produce challenge, verify attestation response (FIDO MDS-style if needed; could be more permissive for self-hosted).
- Authentication: produce challenge, verify assertion, extract PRF output.
- PRF extension handling (CTAP 2.1 / WebAuthn Level 2 §5.2.3): the assertion response includes a 32-byte PRF output that's deterministic for a given (credential, salt) pair. The home hub uses this as the seed to derive the user-keystore master.

**Client-side** primitives needed:
- Initiate registration ceremony, capture credential id + PRF salt.
- Initiate authentication ceremony, extract PRF output for keystore unlock.

**Consumers in personaility (phase 2):**

WebAuthn-PRF is the default daily unlock credential under η-v2 §3. The flow:

1. At user enrollment: client initiates WebAuthn registration with PRF extension; user touches authenticator (passkey on phone, hardware key, etc.); credential id + PRF salt are stored in the credential table on the home hub.
2. At each subsequent unlock: client initiates WebAuthn authentication with PRF extension; user touches authenticator; client receives 32-byte PRF output; client derives the user-keystore master from PRF output (HKDF or similar); HPKE-wraps master to home hub's `encryption:self`; sends to server-side session-establish endpoint.

**Q3 — maintainer-policy decision (yours):**

- **(a)** fgv wraps `@simplewebauthn/server` (Node side) and `@simplewebauthn/browser` (web side) behind a Result-integrated interface. fgv owns the WebAuthn surface from consumers' perspective.

- **(b)** fgv declares WebAuthn application-level. personaility uses `@simplewebauthn/*` directly with thin Result-wrapping adapters in personaility itself.

**Realistic frame:** `@simplewebauthn` is actively maintained (Mathias Bynens / others), broadly used, well-tested. Re-implementing WebAuthn from scratch in fgv is multi-week and not the right ROI. So the realistic question isn't "wrap vs implement"; it's "does fgv want this primitive inside its boundary or outside."

Same shape as Q2 — about fgv's scope rather than technical preference. Tell the user what you'd lean toward and why; user decides.

**Magnitude:** medium if (a) — wrapping is small but it's two packages (server + browser) and the Result-integration adds API design work. Large only if option (a) drifts into "and let's also add a higher-level session manager / credential-table abstraction" — recommend keeping that scope-creep out (the credential table is application-level; personaility owns it).

### Item 4 — HKDF as standalone ICryptoProvider method

**What:** `hkdf(secret, salt, info, length) → Uint8Array`. Native WebCrypto: `crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length)`.

**Bundle with HPKE decision (item 1).** HPKE internally uses HKDF; if HPKE is its own namespace, HKDF can be exposed there or alongside. If HPKE extends `wrapBytes`, HKDF stays internal unless a non-HPKE consumer surfaces.

**Consumers in personaility (potential):**
- HPKE internally (always; bundled).
- Possibly: WebAuthn-PRF output → keystore master derivation step (if not done inside the WebAuthn primitive's surface — this is implementation detail of the unlock flow).
- Possibly: session-key derivation post-HPKE if the design pause for cross-hub flows surfaces a need.

**Magnitude:** small. Decide when implementing item 1.

### Item 5 — Sign/verify wrappers on ICryptoProvider — Q7

**What:** `sign(privateKey, data, algorithm) / verify(publicKey, signature, data, algorithm)` exposed on `ICryptoProvider`. Currently, personaility's parallel-stream phase-0 finding (when shipping the Attestation primitive) confirmed raw `crypto.subtle.sign({ name: 'Ed25519' }, ...)` is the right call site — no fgv wrapper needed.

**The decision — Q7:** Confirm the no-wrapper finding (status quo), OR add wrappers for symmetry with other `ICryptoProvider` operations.

**Magnitude:** small either way. Opinion-shaped, not blocking. Bundle with whatever batch-2 PR feels natural; or skip entirely if the no-wrapper finding stands.

### Item 6 — Standalone constant-time comparison method (speculative)

**What:** `timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean` on `ICryptoProvider`. Node provides `crypto.timingSafeEqual`; browser side would need a constant-time implementation (XOR-walk).

**Status:** lowest priority. After `5.1.0-26` shipped, `verifySecretFromPassword` covers personaility's primary password-verification use case. A standalone method would help for callers comparing raw bytes outside the keystore pattern (e.g., MAC outputs, signed-token comparisons).

**Magnitude:** small. Add only if you find a natural moment; skip otherwise.

---

## Maintainer-policy questions for the user

Two items in batch 2 require user input as fgv-maintainer (not as personaility-consumer):

- **Q2 (Argon2id ownership):** fgv-owned with WASM bundling for browser, OR explicitly application-level?
- **Q3 (WebAuthn primitives):** fgv-wrapped via `@simplewebauthn/*`, OR application-level?

Suggested handoff shape: **when you're ready to start batch-2 implementation, draft your recommendation for each question with reasoning. Surface to the user via the cross-repo coordination channel. User decides; you implement against their answer.**

The cost of waiting for the answer is small if you don't have capacity for batch-2 work yet. If you do, Q1 (HPKE) and items 4-6 can proceed without these decisions; only Q2 and Q3 are gated.

---

## What's NOT in batch 2

To keep batch 2 contained and let later batches have their own scope:

- **Signed-request HTTP scheme (RFC 9421)** — auth implementation concern; personaility builds on top of WebAuthn primitives + session tokens. Not an fgv-side ask.
- **DID resolution / Verifiable Credentials** — if federation eventually adopts DIDs or W3C VCs, those are post-batch-2. The federation-push primitive in personaility's η-v2 architecture uses the existing Attestation primitive (single-signer Ed25519 over canonical JSON) + hub-keypair-signed envelopes; doesn't need DIDs / VCs.
- **OIDC / OAuth2 server primitives** — η-v2 has an OIDC-shaped redirect for cross-hub session-establish, but it's a wire shape using existing primitives (Ed25519 sign + HPKE wrap), not a full OIDC server. Not an fgv-side ask.
- **TLS / certificate primitives** — deployment-shaped, not auth-shaped.
- **Multi-signature Attestation** — personaility's design mentions multi-sig for some Tier-3 entries (counter-signed terms acceptance, dual-signed capability tokens); deferred. The single-signer Attestation primitive shipped via batch 1's `canonicalize()` + Ed25519 sign covers v1.
- **Recovery / revocation lists** — application-level concern; built on Attestation, not new primitives.

If any of these surface during implementation as natural extensions, surface back through the user; don't pull them in unilaterally.

---

## Coordination — cross-repo signals

Same pattern as batch 1:

- **fgv-side signals up when:** Q2/Q3 recommendations ready for user input; implementation underway; PR drafted; the prerelease that absorbs batch 2 (likely `5.1.0-27` or later) is published; or anything surfaces that affects personaility-side scope.
- **fgv-side surfaces up when:** something in the inlined context above appears insufficient or contradictory, or if a primitive shape decision has ambiguity that needs personaility-side input.
- **personaility-side signals down when:** phase 1 ships; phase 2 work begins; new primitive needs emerge from phase-2 work that batch 2 didn't anticipate.

The user remains the bridge for all of these. The personaility repo is private and not reachable from fgv-side tooling, so signal-passing through the user is the only available channel.

---

## What I'd value from your side in response

Whenever you read this — no rush — flag:

- Whether the six items as scoped feel right, or if you'd reorganize.
- Your initial lean on Q2 / Q3 (you can hold the recommendation until you start work, but if you've already got a strong instinct, surface it; saves a round-trip later).
- Anything in this brief that's unclear or under-specified relative to batch 1's level of detail.
- Whether the cross-repo coordination pattern from batch 1 worked from your side, or if there are shape adjustments worth making for batch 2.

Welcome to keep evolving the orchestrator role on your side as the work surfaces what's missing. The personaility-side orchestrator is happy to absorb pattern adjustments back if anything you find applies cross-repo.

---

End of handoff.
