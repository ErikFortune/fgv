# Stream Brief: crypto-batch-2-hpke (phase B — implementation)

**Stream ID:** crypto-batch-2-hpke
**Phase:** B — implementation
**Sequencing:** Phase A signed off. Phase B can run in parallel with `crypto-batch-2-argon2id` and `crypto-batch-2-webauthn` phase B (no file collision — Argon2id and WebAuthn build new packages; only minor potential overlap with Argon2id on `crypto-utils/model.ts`, handled by file-level discipline below).

---

## Context

Phase A produced `.ai/tasks/active/crypto-batch-2-hpke/design.md` (read it in full — inventory + rationale, not the contract). Orchestrator/user signed off with **one significant modification** to the API surface: the design's "subtle as first parameter" function-based API is replaced with a **class-based `HpkeProvider` pattern**. The rest of the design stands.

**This brief is the binding contract** — where it conflicts with `design.md`, this brief wins.

This is feature work on an active-development surface (`@fgv/ts-extras/crypto-utils` + `@fgv/ts-web-extras/crypto-utils`). Per `.ai/instructions/ACTIVE_DEVELOPMENT.md`, free hand on breaking changes; lockstep version policy means changes ship in the same alpha as everything else.

---

## Mission

Implement HPKE base mode (RFC 9180, `DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM`) as a class-based `HpkeProvider` in `@fgv/ts-extras/crypto-utils`, re-exported via `@fgv/ts-web-extras/crypto-utils` for browser callers. Plus HKDF as an exposed primitive on the same class. 100% test coverage, lint pass, `LIBRARY_CAPABILITIES.md` update, pre-merge artifact migration.

---

## Signed-off design decisions (binding)

The decisions baked into `design.md` stand unless overridden below.

### D1. Cipher suite (from design)

- KEM: `DHKEM(X25519, HKDF-SHA256)` (KEM_ID = `0x0020`)
- KDF: `HKDF-SHA256` (KDF_ID = `0x0001`)
- AEAD: `AES-256-GCM` (AEAD_ID = `0x0002`)

### D2. API surface — CLASS shape (overrides design §2)

**Replaces the design's standalone-function-with-subtle-first-param pattern.** The signoff-modified shape:

```typescript
export class HpkeProvider {
  private readonly _subtle: SubtleCrypto;

  private constructor(subtle: SubtleCrypto) {
    this._subtle = subtle;
  }

  public static create(subtle: SubtleCrypto): Result<HpkeProvider> {
    return captureResult(() => new HpkeProvider(subtle));
  }

  public async sealBase(
    recipientPublicKey: CryptoKey,
    info: Uint8Array,
    aad: Uint8Array,
    plaintext: Uint8Array
  ): Promise<Result<IHpkeSealResult>>;

  public async openBase(
    recipientPrivateKey: CryptoKey,
    info: Uint8Array,
    aad: Uint8Array,
    enc: Uint8Array,
    ciphertext: Uint8Array
  ): Promise<Result<Uint8Array>>;

  public async hkdf(
    secret: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number
  ): Promise<Result<Uint8Array>>;
}

// envelope helpers stay as static methods on the class OR as namespace-level exports
// (implementer's choice; both fine — they don't need subtle):
export namespace HpkeProvider {
  export function encodeEnvelope(result: IHpkeSealResult): Uint8Array;
  export function decodeEnvelope(envelope: Uint8Array): Result<{ enc: Uint8Array; ciphertext: Uint8Array }>;
}
```

**Why class-based:**
- Matches existing fgv crypto-utils pattern (`NodeCryptoProvider`, `BrowserCryptoProvider`, `KeyStore`, `DirectEncryptionProvider` — all classes with `create` factories)
- Captures `subtle` once at construction; no per-call cognitive overhead at consumer call sites
- Standard fgv factory pattern (private constructor + static `create` returning `Result`)
- Stays separate from `ICryptoProvider` per D1 (architectural intent preserved — HPKE is its own provider class, not a method on the crypto provider)
- Test injection still trivial (pass mock subtle into `create`)

**Naming:** Class is `HpkeProvider` (or just `Hpke` if the design's namespace name is preserved as the class name — implementer's choice; the design's `Hpke` namespace becomes the class). Cross-stream: stays consistent with `NodeCryptoProvider`/`BrowserCryptoProvider` shape.

### D3. Ciphertext format — inclusive auth tag (from design Q2)

`IHpkeSealResult.ciphertext` includes the 16-byte AES-256-GCM authentication tag appended (`plaintext.length + 16` bytes). Matches Web Crypto's natural output; consumers needing separate tag bytes use the envelope encode/decode helpers.

```typescript
export interface IHpkeSealResult {
  readonly enc: Uint8Array;          // 32-byte X25519 ephemeral pubkey (raw export)
  readonly ciphertext: Uint8Array;   // GCM ciphertext + tag concatenated
}
```

### D4. HKDF placement — on `HpkeProvider`, NOT on `ICryptoProvider` (from design §4 + signoff)

HKDF lives on the `HpkeProvider` class as the `hkdf(secret, salt, info, length)` method. Not promoted to `ICryptoProvider`. Argument from design: adding to `ICryptoProvider` would be a breaking change for third-party implementations. Argument from signoff: WebAuthn doesn't need HKDF in its boundary; the cross-stream coordination is resolved.

If future demand surfaces for `ICryptoProvider.hkdf`, promote then.

### D5. `info` parameter — `Uint8Array`, no default, first-class (from design §5)

Load-bearing. Callers MUST supply context-binding bytes. JSDoc reiterates the cross-context-replay risk. No convenience helper for context construction — application-specific conventions are caller-determined.

### D6. Cross-runtime strategy — shared test vectors, no separate browser runner (from design §6)

Test-vector constants live in a shared file consumed by both `ts-extras` and `ts-web-extras` Jest suites. Follow the existing `wrapBytes` precedent. Browser-side `HpkeProvider` is **re-exported** from `ts-extras` (the implementation lives in `ts-extras/crypto-utils/hpkeProvider.ts`); `ts-web-extras/crypto-utils/index.ts` re-exports `HpkeProvider` for browser callers.

### D7. Internal primitives stay internal (from design §2)

KEM Encap, KEM Decap, and KeySchedule are NOT exported. Only the five public operations (`sealBase`, `openBase`, `hkdf`, `encodeEnvelope`, `decodeEnvelope`) are public surface. Prevents misuse like shared-secret reuse across multiple seals.

### D8. No context-binding helper (from design)

`info` construction conventions (domain-separation prefixes, separator bytes, length encoding) are application-determined. fgv does not ship a helper; the JSDoc on `info` covers the discipline.

---

## Phase B step zero (B.0) — live RFC verification (orchestrator-flagged)

The phase A agent's research session was rfc-editor.org-blocked (HTTP 403); the protocol details in `design.md §1` are drawn from the agent's training corpus. **B.0 is non-optional.**

Before writing implementation code:

1. Fetch RFC 9180 directly from `https://www.rfc-editor.org/rfc/rfc9180` (or via web-search if direct fetch blocked).
2. Verify the algorithm pseudocode in design §1 (LabeledExtract, LabeledExpand, DHKEM Encap/Decap, key schedule) matches the RFC.
3. Verify test vector availability — RFC 9180 Appendix A — check whether the exact cipher suite `DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM` has canonical vectors. If only `AES-128-GCM` X25519 vectors exist (which the design suggests is the case), commit to self-generated cross-runtime anchors: generate test vectors with one runtime (Node `crypto.webcrypto.subtle`) and validate the browser implementation produces byte-identical output.
4. Record the verification outcome in `state.md` (Decisions log). If any algorithm detail differs from the design, surface as an orchestrator question rather than improvising.

---

## Phase B implementation phases

### B.1 — Type definitions

In `libraries/ts-extras/src/packlets/crypto-utils/hpkeProvider.ts` (new file):

- `IHpkeSealResult` interface (per D3)
- `HpkeProvider` class skeleton with private constructor, static `create`, async method signatures
- `encodeEnvelope` / `decodeEnvelope` as namespace-level static methods (per D2)

JSDoc on every exported type. The `info` parameter's JSDoc spells out the load-bearing nature and the cross-context-replay risk.

Re-export `HpkeProvider` from `crypto-utils/index.ts`. Add browser re-export from `ts-web-extras/crypto-utils/index.ts`.

**Checkpoint:** types compile; api-extractor surface reviewed.

### B.2 — Core primitives (internal)

Private methods on `HpkeProvider` (or internal helpers in `hpkeProvider.ts`):

- DHKEM Encap (ephemeral X25519 keypair gen + DH + LabeledExtract + LabeledExpand → shared_secret + enc)
- DHKEM Decap (deserialize enc + DH + same LabeledExtract/LabeledExpand path)
- KeySchedule (psk_id_hash, info_hash, key_schedule_context, secret, then derive AEAD key + base_nonce + exporter_secret per RFC §5.1)
- LabeledExtract / LabeledExpand (HMAC-based, since Web Crypto's HKDF is combined-only — implement raw HMAC per design §1)

These are NOT exported; they're internal building blocks. Per D7.

**Checkpoint:** internal primitives compile and roundtrip against test vectors from B.0.

### B.3 — Public operations

- `sealBase`: validate recipient pubkey shape; generate ephemeral; encap; KeySchedule; AES-GCM encrypt; return `{enc, ciphertext}` per D3
- `openBase`: validate recipient privkey shape; decap; KeySchedule; AES-GCM decrypt; return plaintext
- `hkdf`: implement RFC 5869 Extract-then-Expand via HMAC-SHA256 (Web Crypto's combined HKDF doesn't expose Extract alone; implement raw)
- `encodeEnvelope` / `decodeEnvelope`: simple concatenation/split (32 enc bytes + variable ciphertext)

All async public methods return `Result<T>` via `captureAsyncResult`. Result.fail messages include enough context for debugging without leaking key material.

**Checkpoint:** end-to-end seal→open roundtrip passes for both Node and browser test vectors.

### B.4 — Tests + coverage

Test files:
- `libraries/ts-extras/src/test/unit/crypto/hpkeProvider.test.ts` — Node side
- `libraries/ts-web-extras/src/test/unit/hpkeProvider.test.ts` — Browser side
- Shared test-vector constants file (placement: per design §6 — likely `libraries/ts-extras/src/test/unit/crypto/hpke-vectors.ts` or similar; both test files import)

Test coverage:
- Cipher-suite vectors (RFC 9180 if available, or self-generated cross-runtime anchors per B.0)
- Roundtrip: seal then open with same `info` and `aad` — recovers plaintext
- `info` mismatch: seal with `info=X`, open with `info=Y` — fails (AEAD verification)
- `aad` mismatch: seal with `aad=X`, open with `aad=Y` — fails
- Wrong recipient key: seal to recipient A, open with recipient B's privkey — fails
- Tampered ciphertext: flip one byte in ciphertext, open fails
- Tampered enc: flip one byte in enc, open fails
- Empty plaintext, empty aad — valid; roundtrip works
- HKDF: known-vector tests (RFC 5869 test vectors A.1, A.2, A.3 if applicable to SHA-256)
- Cross-runtime equivalence: `ts-extras` and `ts-web-extras` test files import the same vector constants and verify byte-identical output
- Envelope encode/decode roundtrip

100% coverage required. Per `.ai/instructions/CODING_STANDARDS.md` § Pre-PR Validation Checklist, full `rushx build && rushx lint && rushx test` must pass locally before opening PR.

### B.5 — Documentation

Update `.ai/instructions/LIBRARY_CAPABILITIES.md`:

- Expand the `crypto-utils` packlet entry to mention `HpkeProvider` (RFC 9180 base mode; the cipher suite; the class shape with `create` factory)
- Add a new decision shortcut: **"Need to wrap material to a recipient via HPKE (RFC 9180)?"** → describe `HpkeProvider.create(subtle).orThrow().sealBase(...)` pattern; note `info` is load-bearing
- Note that HKDF is exposed on `HpkeProvider.hkdf(...)` (not on `ICryptoProvider`) for now

**Checkpoint:** docs reflect implementation; api-extractor regenerated for both packages.

### B.6 — Pre-merge artifact migration

Migrate `.ai/tasks/active/crypto-batch-2-hpke/` → `.ai/tasks/completed/2026-05/crypto-batch-2-hpke/`. Write a **separate polished `README.md`** (not just the migrated state.md) capturing:

- What shipped (HpkeProvider class, cipher suite, envelope helpers, HKDF)
- Key decisions including the signoff modification (class-based vs functions)
- B.0 RFC verification outcome (cited vectors or self-generated anchors)
- Acceptance status
- Followups: TECH_DEBT / FUTURE candidates

Pre-merge migration is mandatory per `.ai/conventions/workflow/artifact-protocol.md`. Don't repeat the early-cluster pattern of treating "state.md migrated" as fulfilling the README requirement.

---

## Package surface

### In-scope (modify)

- `libraries/ts-extras/src/packlets/crypto-utils/hpkeProvider.ts` (new file — the class + helpers)
- `libraries/ts-extras/src/packlets/crypto-utils/index.ts` (export `HpkeProvider`)
- `libraries/ts-extras/etc/ts-extras.api.md` (regenerate)
- `libraries/ts-extras/src/test/unit/crypto/hpkeProvider.test.ts` (new)
- Shared test-vector constants file
- `libraries/ts-web-extras/src/packlets/crypto-utils/index.ts` (re-export `HpkeProvider`)
- `libraries/ts-web-extras/etc/ts-web-extras.api.md` (regenerate)
- `libraries/ts-web-extras/src/test/unit/hpkeProvider.test.ts` (new)
- `.ai/instructions/LIBRARY_CAPABILITIES.md` (decision shortcut + packlet entry update)
- `.ai/tasks/active/crypto-batch-2-hpke/state.md` (checkpoint updates)
- Pre-merge: migrate `.ai/tasks/active/crypto-batch-2-hpke/` → `.ai/tasks/completed/2026-05/crypto-batch-2-hpke/` with polished `README.md`

### Out-of-scope

- `wrapBytes`/`unwrapBytes` (ECIES — separate primitive; D1)
- `ICryptoProvider` modifications (HpkeProvider is its own class; D2)
- Argon2id, WebAuthn surfaces (parallel streams)
- HPKE auth mode, PSK mode, auth-PSK mode (base mode only)
- Sudoku packages

### Parallel-stream awareness

`crypto-batch-2-argon2id` phase B may touch `crypto-utils/model.ts` (to add the `IKeyDerivationParams` discriminated union). HPKE phase B introduces a new file (`hpkeProvider.ts`) and only modifies `crypto-utils/index.ts` (to add the `HpkeProvider` export). Collision risk on `model.ts` only if HPKE phase B also edits it (it shouldn't — HpkeProvider doesn't need ICryptoProvider type additions). If something forces a model.ts edit, coordinate with the Argon2id agent via state.md checkpoints.

---

## Required reading (priority order)

1. `.ai/tasks/active/crypto-batch-2-hpke/brief-phase-b.md` (this file) — binding contract
2. `.ai/tasks/active/crypto-batch-2-hpke/design.md` — phase A inventory + algorithm pseudocode (verify at B.0)
3. `.ai/tasks/active/crypto-batch-2-hpke/brief.md` — phase A contract (still useful for original scope framing)
4. `.ai/notes/cross-repo-handoffs/fgv-batch-2-handoff-2026-05.md` — consumer context
5. RFC 9180 (HPKE) — section 5 (key schedule), section 6 (modes; we need §6.1 base mode), section 9 (test vectors), appendix A
6. `libraries/ts-extras/src/packlets/crypto-utils/` — existing patterns:
   - `nodeCryptoProvider.ts` and `browserCryptoProvider.ts` for class-with-create-factory shape
   - `keystore/` for nested-class organization in the packlet
   - `wrapBytes.ts` for analogous protocol implementation precedent
7. `libraries/ts-web-extras/src/packlets/crypto-utils/` — browser-side patterns
8. `.ai/instructions/CODING_STANDARDS.md` § Pre-PR Validation Checklist — lint discipline; full validation suite required before PR
9. `.ai/instructions/TESTING_GUIDELINES.md` — Result matchers, 100% coverage requirement

---

## Skills to load (when conditions trigger)

- `/result-pattern` — load before writing any function returning `Result<T>` (all public methods)
- `/result-tests` — load before writing tests; use Result matchers
- `/published-primitives-reflex` — load before writing utility helpers
- `/type-safe-validation` — load if input-validation surfaces (likely minimal — primary inputs are typed `CryptoKey` and `Uint8Array`)

---

## Acceptance criteria

- [ ] B.0 RFC verification outcome captured in state.md
- [ ] `HpkeProvider` class with private constructor + static `create` factory
- [ ] All five public operations implemented and tested
- [ ] Cross-runtime byte-identical output verified (Node ↔ browser) via shared test vectors
- [ ] `info` parameter discipline documented in JSDoc; load-bearing nature called out
- [ ] `rushx build` passes in `ts-extras` and `ts-web-extras`
- [ ] **`rushx lint` passes in `ts-extras` and `ts-web-extras`** (load-bearing — NOT transitively run by build; see CODING_STANDARDS § Pre-PR Validation Checklist)
- [ ] `rushx test` passes with 100% coverage in `ts-extras` and `ts-web-extras`
- [ ] **`rushx fixlint` was run before the final commit**
- [ ] No `any` types; all fallible operations return `Result<T>`
- [ ] No inline lint-rule-disable directives added to make lint pass
- [ ] api-extractor regenerated (`ts-extras.api.md`, `ts-web-extras.api.md`)
- [ ] `LIBRARY_CAPABILITIES.md` updated with new decision shortcut + packlet entry
- [ ] Pre-merge artifact migration to `.ai/tasks/completed/2026-05/crypto-batch-2-hpke/` with **separate polished README.md** (not just migrated state.md)
- [ ] PR opened against `claude/crypto-batch-2-features` (NOT `release`)

---

## Branch + PR posture

- **Base branch:** `claude/crypto-batch-2-features` (cluster integration)
- **Work branch:** `claude/crypto-batch-2-hpke-impl` (or harness-auto-suffix; document the actual branch in state.md)
- **PR target:** `claude/crypto-batch-2-features`
- One PR for all of B.0–B.6 unless something forces a split.

---

## Don't

- Don't open the PR until `rushx build && rushx lint && rushx test` all pass locally. `rushx build` does NOT transitively run lint; lint is a separate gate. Run `rushx fixlint` before the final commit.
- Don't expose Encap/Decap/KeySchedule as public surface — internal only (D7)
- Don't promote `hkdf` to `ICryptoProvider` — stays on `HpkeProvider` (D4)
- Don't add helpers for `info` construction — caller's responsibility (D8)
- Don't add HPKE auth mode / PSK mode / auth-PSK mode — base mode only (out of scope)
- Don't modify `wrapBytes`/`unwrapBytes` — separate primitive (D1)
- Don't skip B.0. The phase A research was rfc-editor.org-blocked; live verification is required before encoding constants.

---

## Resume protocol

If the session ends mid-phase: read `brief-phase-b.md` (this file), `design.md`, and `state.md` to resume. State.md records which checkpoints (B.0–B.6) are done.

---

## Missing-input rule

If a required-reading file is missing or has a shape that conflicts with this brief, or if B.0 RFC verification surfaces algorithm differences from the design, **STOP and report**. Do not improvise.
