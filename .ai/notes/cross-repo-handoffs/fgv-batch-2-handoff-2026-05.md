# fgv batch 2 — auth primitives handoff (sanitized)

**From:** consumer project orchestrator
**To:** fgv project orchestrator
**Date:** 2026-05-11
**Status:** scoped; awaits user maintainer-policy decisions on Q2 + Q3 before implementation kickoff.

> **Archive note (fgv orchestrator, 2026-05-11):** This brief was hand-delivered from the consumer's orchestrator (cross-repo MCP scope didn't permit direct read of the consumer's repo). The original brief was sanitized to remove consumer-specific naming and internal architectural detail; the shape of the requested primitives, the maintainer-policy questions, and the magnitude estimates are preserved. Decisions taken on Q1/Q2/Q3/Q7 are captured in the substrate-prep commit and in the per-stream `state.md` files.

---

## Cross-repo coordination context

A consumer project built on the `@fgv/*` library family is implementing a substantial authentication / identity / cryptographic-trust arc. Batch 1 already shipped in `5.1.0-26` (X25519 keypair support, `Hash.Normalizer` RFC 8785 `canonicalize()` extension, multibase/SPKI encoding helpers, `LIBRARY_CAPABILITIES.md` updates). This brief covers batch 2.

The orchestrator-to-orchestrator handoff pattern is established. This brief is written in that shape — orchestrator-to-orchestrator, not implementer-precise. fgv-side decides phase shape, kicks off implementing agents, surfaces up to the user when maintainer-policy decisions are needed; the consumer consumes the published primitives when they land.

Access constraint: the consumer's repo is private and not reachable from fgv-side tooling. This brief is self-contained.

---

## Strategic context

Two phases of auth work on the consumer side:

- **Phase 1** — passphrase-based credentials; PBKDF2-derived key material; HMAC-signed sessions. Does NOT need batch 2. Built on what shipped in `5.1.0-26`.
- **Phase 2** — WebAuthn-PRF as default unlock credential with passphrase fallback; Argon2id key derivation; HPKE-wrapped per-conversation material delivery; recovery rows. Needs batch 2 in full.

Key architectural commitments relevant to batch 2:

- Actors have Ed25519 signing keypairs + X25519 encryption keypairs
- Material-at-rest is encrypted with keys derived from caller credentials
- At unlock time, derived keys are HPKE-wrapped to a server-side encryption pubkey with `info`-bound replay protection
- Per-session material delivery: sender HPKE-wraps to recipient's encryption pubkey
- Recovery rows: a high-entropy machine-generated phrase → Argon2id → unwraps an alternate-master copy

**Timing pressure is low.** Phase 1 ships first; phase 2 begins weeks later. Batch 2 can run on fgv's capacity over the next month or two.

**Exception**: Argon2id has slight earlier pull if phase 1 grows to include recovery rows.

**HPKE has the latest pull** — needed at the phase-2 step where material delivery becomes per-session rather than statically scoped.

---

## The six items

### Item 1 — HPKE base mode (RFC 9180)

**What:** standard HPKE base mode with:
- KEM: `DHKEM(X25519, HKDF-SHA256)`
- KDF: `HKDF-SHA256`
- AEAD: `AES-256-GCM` (id `0x0002`)

Entry points:
- `SealBase(pkR, info, aad, plaintext) → (enc, ct, tag)` — sender side
- `OpenBase(skR, info, aad, enc, ct, tag) → plaintext` — recipient side

The `info` parameter is load-bearing for security: it binds each wrap to a specific context (session id, conversation id, etc.) so a captured ciphertext cannot be replayed in a different context. Must be a first-class parameter, not a fixed empty string.

**Consumer use shapes (phase 2):**

1. **Per-session material delivery.** Sender HPKE-seals material to recipient's encryption pubkey, `info` bound to a session/conversation identifier.
2. **Master-key delivery at unlock.** Client derives key from credential (WebAuthn-PRF or Argon2id-from-phrase), HPKE-seals to server's encryption pubkey for delivery. Server holds derived material in memory bounded by session lifetime; zeroed on session end. Replay protection from `info` binding to the session-establish challenge.
3. **Recovery-proof envelopes.** Wraps for recovery rows use HPKE.
4. **Cross-instance material delivery (later).** When federation work lands, instance-to-instance envelope wrapping uses HPKE.

**Q1 — surface decision (maintainer call):**

- **(a)** Extend the existing `wrapBytes` / `unwrapBytes` API to accept HPKE as a new option within the same surface.
- **(b)** Introduce a separate `HPKE` namespace in `@fgv/ts-extras` (and `@fgv/ts-web-extras`), leaving `wrapBytes` / `unwrapBytes` as the ECIES-specific primitive.

Current `wrapBytes` / `unwrapBytes` is ECIES over P-256. HPKE is a different primitive: different curve, different KDF wiring, different AEAD parameterization, explicit `info` binding. Mixing them under one API may be ergonomically awkward; separating avoids confusion.

**Magnitude:** large. Multi-step protocol; both Node and browser implementations needed.

### Item 2 — Argon2id

**What:** standard Argon2id key derivation (RFC 9106). Function shape:

```
argon2id(password: Uint8Array | string,
         salt: Uint8Array,
         params: { memoryKiB, iterations, parallelism, outputBytes })
  → Uint8Array (derived bytes)
```

Deployed parameters need to be calibrated for the consumer's threat model; OWASP recommendation defaults (memoryKiB ≈ 19456, iterations ≈ 2, parallelism = 1, outputBytes = 32) are a reasonable starting point.

**Consumer use shapes:**

1. **High-entropy phrase → key for recovery rows.** Machine-generated phrase → Argon2id → key. Memory-hardness defends against precomputation.
2. **Passphrase → master for fallback auth.** User-typed passphrase → Argon2id → master, replacing PBKDF2.

**Q2 — maintainer-policy decision (yours):**

- **(a)** fgv owns Argon2id. Node side wraps a native library; browser side bundles a WASM implementation. Unified interface across runtimes.
- **(b)** fgv declares Argon2id outside scope. Consumers reach for their chosen implementation directly.

**Cost asymmetry:**

- (a) puts WASM bundling concern in `@fgv/ts-web-extras`: ~200-400 KB bundle addition, version-pinning concerns, the cross-runtime output-equivalence test surface (Node and browser must produce bit-identical outputs for identical inputs, or the recovery-row use case breaks across browser-derived-vs-server-derived).
- (b) duplicates the "which Argon2 implementation" choice across consumers, but keeps fgv's bundling story simple.

Real maintainer-scope question, not technical preference.

**Magnitude:** medium if (a); near-zero if (b).

### Item 3 — WebAuthn primitives

**What:** server-side and client-side primitives for the WebAuthn-PRF unlock ceremony.

**Server-side** primitives needed:
- Registration: produce challenge, verify attestation response
- Authentication: produce challenge, verify assertion, extract PRF output
- PRF extension handling (CTAP 2.1 / WebAuthn Level 2 §5.2.3): assertion response includes a 32-byte PRF output deterministic for a given (credential, salt) pair

**Client-side** primitives needed:
- Initiate registration, capture credential id + PRF salt
- Initiate authentication, extract PRF output for derivation

**Consumer use shape:** PRF output → derived master → HPKE-wrap → server-side delivery on session establish.

**Q3 — maintainer-policy decision (yours):**

- **(a)** fgv wraps `@simplewebauthn/server` and `@simplewebauthn/browser` behind a Result-integrated interface.
- **(b)** fgv declares WebAuthn application-level. Consumers wrap directly.

**Realistic frame:** `@simplewebauthn` is actively maintained, broadly used, well-tested. Re-implementing WebAuthn from scratch is multi-week and not the right ROI. So the realistic question isn't "wrap vs implement"; it's "does fgv want this primitive inside its boundary or outside."

Same shape as Q2 — about fgv's scope rather than technical preference.

**Magnitude:** medium if (a) — wrapping is small but it's two packages and Result-integration adds API design work. Recommend keeping out scope-creep ("and let's also add a higher-level session manager / credential-table abstraction" — the credential-management surface is application-level).

### Item 4 — HKDF as standalone ICryptoProvider method

**What:** `hkdf(secret, salt, info, length) → Uint8Array`. Native WebCrypto: `crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length)`.

**Bundle with HPKE decision (item 1).** HPKE internally uses HKDF; if HPKE is its own namespace, HKDF can be exposed there or alongside. If HPKE extends `wrapBytes`, HKDF stays internal unless a non-HPKE consumer surfaces.

**Magnitude:** small. Decide when implementing item 1.

### Item 5 — Sign/verify wrappers on ICryptoProvider — Q7

**What:** `sign(privateKey, data, algorithm) / verify(publicKey, signature, data, algorithm)` exposed on `ICryptoProvider`. Currently, consumer-side finding (from a prior parallel stream shipping a signing primitive) confirmed raw `crypto.subtle.sign({ name: 'Ed25519' }, ...)` is the right call site — no fgv wrapper needed.

**The decision — Q7:** Confirm the no-wrapper finding (status quo), OR add wrappers for symmetry with other `ICryptoProvider` operations.

**Magnitude:** small either way. Opinion-shaped, not blocking.

### Item 6 — Standalone constant-time comparison method (speculative)

**What:** `timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean` on `ICryptoProvider`. Node provides `crypto.timingSafeEqual`; browser side needs a constant-time implementation (XOR-walk).

**Status:** lowest priority. After `5.1.0-26` shipped, `verifySecretFromPassword` covers the primary password-verification use case. A standalone method would help for callers comparing raw bytes outside the keystore pattern (MAC outputs, signed-token comparisons).

**Magnitude:** small. Add when natural; skip otherwise.

---

## Maintainer-policy questions for the user

Two items require user input as fgv-maintainer (not as consumer):

- **Q2 (Argon2id ownership):** fgv-owned with WASM bundling for browser, OR application-level?
- **Q3 (WebAuthn primitives):** fgv-wrapped via `@simplewebauthn/*`, OR application-level?

Suggested handoff shape: **when ready to start batch-2 implementation, draft a recommendation for each question with reasoning. Surface to the user via the cross-repo coordination channel. User decides; fgv-side implements against their answer.**

Q1 (HPKE surface) and items 4-6 can proceed without these decisions; only Q2 and Q3 are gated.

---

## What's NOT in batch 2

To keep batch 2 contained and let later batches have their own scope:

- **Signed-request HTTP scheme (RFC 9421)** — auth implementation concern; not fgv-side.
- **DID resolution / Verifiable Credentials** — federation-side concern, post-batch-2; uses existing primitives (single-signer Ed25519 over canonical JSON + signed envelopes).
- **OIDC / OAuth2 server primitives** — wire shapes using existing primitives, not full server implementations.
- **TLS / certificate primitives** — deployment-shaped, not auth-shaped.
- **Multi-signature attestation** — deferred; single-signer covers v1.
- **Recovery / revocation lists** — application-level; built on attestation, not new primitives.

---

## Coordination — cross-repo signals

- **fgv-side signals up when:** Q2/Q3 recommendations ready; implementation underway; PR drafted; the prerelease absorbing batch 2 is published; or anything affects consumer-side scope.
- **fgv-side surfaces up when:** something in the inlined context appears insufficient or contradictory, or if a primitive shape decision has ambiguity needing consumer-side input.
- **consumer-side signals down when:** new primitive needs emerge that batch 2 didn't anticipate.

The user remains the bridge for all signals. The consumer's repo is private and not reachable from fgv-side tooling, so signal-passing through the user is the only available channel.

---

End of handoff.
