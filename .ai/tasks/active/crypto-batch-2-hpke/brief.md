# Stream Brief: crypto-batch-2-hpke (phase A — research and design)

**Stream ID:** crypto-batch-2-hpke
**Cluster:** crypto-batch-2 (integration branch `claude/crypto-batch-2-features`)
**Phase:** A — research and design (no production code)
**Sequencing:** Phase A can run in parallel with the other three crypto-batch-2 streams' phase A work (outputs are disjoint). Phase B serialization across the cluster is decided post-design-signoff.

---

## Context

The personaility consumer needs HPKE base mode (RFC 9180) for several Phase 2 flows: per-conversation BYOK delivery, session-master-wrap at unlock, recovery-proof envelopes, and (post-batch-2) cross-hub material delivery. Each binding uses the `info` parameter to bind ciphertext to a specific context so a captured ciphertext can't be replayed elsewhere.

**This is feature work on an active surface (`@fgv/ts-extras/crypto-utils` and `@fgv/ts-web-extras/crypto-utils`).** Per `.ai/instructions/ACTIVE_DEVELOPMENT.md`, `crypto-utils` is on the active-development list — free hand on breaking changes, but lockstep version policy means every consumer integrates the delta whether they wanted it or not.

The full personaility-side context is archived at `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md`. Read it for the consumer's framing if anything below feels under-specified.

### Decisions already made (orchestrator + user, 2026-05-11)

These resolved before phase A starts. The design must respect them:

- **D1 — Separate namespace.** HPKE lives in its own namespace, not as an extension of `wrapBytes` / `unwrapBytes`. They are different cryptographic protocols (ECIES P-256 vs RFC 9180 HPKE X25519) with different security properties and parameterization; smearing them under one API would harm reason-ability. If a future need for unified abstraction emerges, build an abstraction over both — don't ram them together.
- **D2 — HKDF exposed alongside HPKE.** HKDF lives in this stream's deliverable. Whether it's a standalone `ICryptoProvider.hkdf` method, an export from the HPKE namespace, or both — design decision.

---

## Mission

Produce a design document at `.ai/tasks/active/crypto-batch-2-hpke/design.md` that an implementing agent could execute against. The design must cover the HPKE base-mode surface, the HKDF placement, both Node and browser implementations, and the cross-runtime testing strategy.

**Do not modify production code in this phase.** Read freely; write only `design.md` and `state.md`.

---

## Phase A deliverable: `design.md`

Required sections, in order:

### 1. HPKE base mode — protocol summary

Brief restatement of RFC 9180 base mode with the specific cipher suite we're implementing:
- KEM: `DHKEM(X25519, HKDF-SHA256)` (id `0x0020`)
- KDF: `HKDF-SHA256` (id `0x0001`)
- AEAD: `AES-256-GCM` (id `0x0002`)

Note any RFC 9180 nuances that affect implementation (the encapsulated key shape, the `key_schedule` derivation, the context binding via `info`).

Cite the RFC and any other authoritative reference (e.g. Cloudflare's HPKE implementation reference).

### 2. API surface — function signatures and namespace

Propose the exact exported function signatures for the HPKE module. Recommend a namespace name (e.g. `Hpke`, `HPKE`, `Crypto.Hpke` — pick what fits fgv's idioms).

For each function:
- Signature with types
- Result-typed where fallible (`Result<T>` from `@fgv/ts-utils`)
- JSDoc summary
- Document the `info` parameter as load-bearing and first-class (not optional with a default empty value)

Required operations:
- `sealBase(recipientPublicKey, info, aad, plaintext)` → `Result<{ enc, ciphertext, tag }>` (sender side)
- `openBase(recipientPrivateKey, info, aad, encapsulatedKey, ciphertext, tag)` → `Result<plaintext>` (recipient side)
- Possibly: helpers for encoding `enc` + `ct` + `tag` as a single bytes blob (a "wrap envelope" representation). Decide and justify.

Consider whether to surface lower-level primitives (encap/decap, key_schedule) for advanced consumers, or strictly the seal/open pair. Recommend one; justify.

### 3. Package placement

The new module(s) live in:
- `@fgv/ts-extras/crypto-utils` (Node side) — uses Node's `crypto.subtle` for the underlying primitives
- `@fgv/ts-web-extras/crypto-utils` (browser side) — uses Web Crypto API

Both runtimes have all required primitives natively (X25519 since Node 20+, HKDF since Node 18+, AES-256-GCM in both forever). No WASM bundling needed for HPKE itself.

Confirm this in the design, and note any runtime-version constraints we need to advertise.

### 4. HKDF placement

D2 says HKDF surfaces in this stream. Two reasonable placements:
- **(a)** Standalone method on `ICryptoProvider.hkdf(...)` — available to all consumers regardless of HPKE
- **(b)** Exported from the HPKE namespace as a helper — only HPKE-shaped use cases

Recommend one. Note that personaility's potential second HKDF use case (PRF output → keystore master derivation) might warrant (a); but if that derivation lives inside the WebAuthn primitive's surface in `crypto-batch-2-webauthn`, it might warrant (b). Coordinate with the design intent of the parallel WebAuthn stream where reasonable, but don't block on it.

### 5. `info` parameter convention

The `info` parameter binds ciphertext to context (session id, conversation id, recovery-row id, etc.). Caller supplies bytes; HPKE binds them into the key schedule. Risk: callers from different consumer paths use *overlapping* `info` values by accident → cross-context replay.

Propose:
- Type for `info`: `Uint8Array`, or `string` with implicit UTF-8 encoding, or a structured object the wrapper canonicalizes?
- Whether fgv provides any helpers for building canonical context-binding bytes (e.g. domain-separation prefix + structured payload)
- Documentation guidance for callers on `info` discipline

Recommendation lean: keep the API simple (caller supplies `Uint8Array`; document the cross-context risk; let callers like personaility build their own canonical-context helpers). But the design should engage with the question.

### 6. Cross-runtime equivalence

Critical correctness property: HPKE ciphertext sealed in browser must be openable in Node, and vice versa. Specifically:
- Personaility's session-master-wrap: client (browser) seals; home hub (Node) opens
- Personaility's BYOK delivery: client (browser) seals; recipient hub (Node) opens

Propose the cross-runtime test strategy:
- Test vectors from RFC 9180 (the spec includes canonical vectors)
- Round-trip tests between Node and browser implementations (Jest + browser-runner setup, or shared test data verifying both implementations produce identical outputs)
- What's the fgv pattern for this? Check existing crypto-utils tests for the precedent. The phase A agent need not enumerate the implementation; just declare the strategy.

### 7. Implementation plan

Outline phase B implementation breakdown:
- Files to add/modify per package
- Order of work (typically: types → primitives → seal → open → wire helpers → tests → docs)
- Test coverage strategy (100% required per repo convention)
- LIBRARY_CAPABILITIES.md update sketch

This is not the phase B brief — that's the orchestrator's job post-signoff. But the phase A design should be detailed enough that the orchestrator can write a phase B brief from it without re-deriving the structure.

### 8. Migration impact

HPKE is net-new — no existing consumer migration. Document confirmed-absent migration impact for the record.

### 9. Open questions for signoff

Anything the design surfaces that the orchestrator/user should weigh in on. Honest disclosure — the gate is real.

---

## Package surface (read-only for phase A)

Phase A reads but does not modify:
- `libraries/ts-extras/src/packlets/crypto-utils/` — current Node implementation, especially `nodeCryptoProvider.ts`, `wrapBytes`/`unwrapBytes` (ECIES — reference, not extension target), `model.ts`
- `libraries/ts-web-extras/src/packlets/crypto-utils/` — current Browser implementation
- `.ai/instructions/LIBRARY_CAPABILITIES.md` § crypto-utils (current external framing)
- `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md` — consumer context

Phase A writes only:
- `.ai/tasks/active/crypto-batch-2-hpke/design.md` (new)
- `.ai/tasks/active/crypto-batch-2-hpke/state.md` (update at checkpoints)

Phase B (separately commissioned) will modify the crypto-utils packlets in both `ts-extras` and `ts-web-extras` plus `LIBRARY_CAPABILITIES.md`.

---

## Required reading (priority order)

1. `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md` — full consumer context; load-bearing
2. `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` — current Node implementation patterns
3. `libraries/ts-extras/src/packlets/crypto-utils/model.ts` — type definitions, `ICryptoProvider` interface, `KeyPairAlgorithm` union
4. `libraries/ts-extras/src/packlets/crypto-utils/wrapBytes.ts` (or wherever ECIES lives) — reference for what HPKE is *separate from*
5. `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` — current Browser implementation
6. `docs/WORKSTREAMS.md` preamble — repo shape, lockstep policy
7. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `crypto-utils` is on the active list
8. `.ai/instructions/LIBRARY_CAPABILITIES.md` § crypto-utils — current external framing
9. RFC 9180 (HPKE) — section 5 (base mode), section 9 (test vectors), appendix A.1 (test vector for our cipher suite)

---

## Skills to load (when conditions trigger)

- `/published-primitives-reflex` — load before recommending any utility-shaped helper. Check `@fgv/*` first.
- `/result-pattern` — load before proposing function signatures returning `Result<T>` (all of them).
- `/type-safe-validation` — load if any input-validation surface (e.g. validating `enc` bytes) is proposed.

---

## Web access

You may web-search and web-fetch RFC 9180, Cloudflare's HPKE reference implementation, and any authoritative source for the cipher suite specifics. Don't blindly trust training data on RFC details; cite URLs.

---

## Missing-input rule

If a required-reading file is missing, has a shape that conflicts with this brief, or if research surfaces a structural mismatch (e.g. Node's `crypto.subtle` doesn't support X25519 derivation the way this brief assumes), **STOP and report**. Do not improvise.

---

## Phase A acceptance criteria

- [ ] `design.md` exists at the specified path with all nine sections populated
- [ ] HPKE function signatures explicit and Result-typed
- [ ] Namespace name proposed and justified
- [ ] HKDF placement decision (a or b) with rationale
- [ ] Cross-runtime equivalence test strategy concrete
- [ ] `info` convention recommendation with engagement on the cross-context-replay risk
- [ ] Implementation plan detailed enough that the orchestrator can write phase B brief from it

---

## Phase A exit artifact (state.md)

At completion, `state.md` should record:
- Phase A done; Phase B awaiting signoff
- `design.md` path
- Recommendation summary in one paragraph (so the orchestrator can present cleanly to the user)
- Any research dead-ends, surprising findings, or RFC-vs-Web-Crypto-API surprises
- Anything decided to **exclude** from the design and why

---

## Branch + PR posture

- **Base branch:** `claude/crypto-batch-2-features` (the cluster integration branch — NOT `release` directly)
- **Work branch:** `claude/crypto-batch-2-hpke-design` (or your harness's auto-suffixed name; document the actual branch in state.md)
- **PR target:** `claude/crypto-batch-2-features` (NOT `release`)
- Single PR containing `design.md` + updated `state.md`. No production code.

---

## Resume protocol

If the session ends mid-phase: read `brief.md` (this file) and `state.md` to resume. `design.md` is your terminal output for phase A.

---

## Out of scope (both phases)

- HPKE auth mode, PSK mode, auth-psk mode — base mode only for this cluster
- ECIES (`wrapBytes`/`unwrapBytes`) modifications — separate primitive; D1 keeps it untouched
- Argon2id, WebAuthn, sign/verify, timingSafeEqual — parallel crypto-batch-2 streams
- Any package outside `crypto-utils` packlets in `ts-extras` and `ts-web-extras`
- Sudoku packages
- Higher-level abstractions over multiple wrap primitives (per D1, build them when needed, not preemptively)
