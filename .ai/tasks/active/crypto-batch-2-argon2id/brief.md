# Stream Brief: crypto-batch-2-argon2id (phase A — research and design)

**Stream ID:** crypto-batch-2-argon2id
**Cluster:** crypto-batch-2 (integration branch `claude/crypto-batch-2-features`)
**Phase:** A — research and design (no production code)
**Sequencing:** Phase A runs in parallel with the other crypto-batch-2 streams. Phase B sequencing decided post-signoff.

---

## Context

Personaility's Phase 2 needs Argon2id (RFC 9106) for two key-derivation paths:
- **Recovery rows** — 256-bit BIP39 phrase → Argon2id → key that unwraps an alternate-master copy in the credential table. Even though the phrase is high-entropy (machine-generated), Argon2id's memory-hardness defends against precomputation. Personaility may pull this earlier than Phase 2 if recovery rows ship as a Phase 1 polish.
- **Passphrase rows (hybrid auth)** — user-typed passphrase → Argon2id → master, replacing Phase 1's PBKDF2 when hybrid auth lands.

**This is feature work on an active surface.** The full personaility-side context is at `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md`.

### Decisions already made (orchestrator + user, 2026-05-11)

These resolved before phase A starts. The design must respect them:

- **D1 — fgv owns Argon2id; separate packages.** Argon2id implementation lives in NEW packages, NOT in existing `crypto-utils` packlets:
  - `@fgv/ts-extras-argon2` (Node — likely wraps `@node-rs/argon2` or `argon2`)
  - `@fgv/ts-web-extras-argon2` (Browser — bundles a WASM implementation)
  Rationale: WASM bundle is ~200-400 KB; non-Argon2id consumers must not pay this cost. Consumers needing Argon2id opt in by adding the dependency.

- **D2 — Injectable dependency / composition shape.** The default `NodeCryptoProvider` / `BrowserCryptoProvider` in existing crypto-utils DO NOT implement Argon2id. Consumers compose (e.g. `new NodeCryptoProvider({ argon2: new NodeArgon2Provider() })`, or similar — the exact shape is part of this design's deliverable). This is the load-bearing "consumers don't pay for what they don't use" win.

- **D3 — Cross-runtime output equivalence is the load-bearing correctness property.** Personaility's recovery-row flow requires Node-derived bytes ≡ Browser-derived bytes for identical inputs, because keys derived in one runtime are used to unwrap material in the other. Phase B will need a parameter sweep test verifying bit-identical output across the two implementations. Phase A's design must specify the test strategy concretely enough that phase B's brief can codify it as an acceptance criterion.

- **D4 — Ongoing version-sync responsibility is fgv's.** Argon2id is a memory-hard KDF; security implications mean possible short-notice security updates in the wrapped implementations. fgv concentrates this risk so consumers don't each re-figure-out the delta. Phase A's design should note any known version-pin constraints across the chosen Node + browser libraries.

---

## Mission

Produce a design document at `.ai/tasks/active/crypto-batch-2-argon2id/design.md` covering the package structure, the composition idiom, the wrapped-library choices, the cross-runtime equivalence test strategy, and parameter recommendations.

**Do not modify production code in this phase.** Read freely; write only `design.md` and `state.md`.

---

## Phase A deliverable: `design.md`

Required sections, in order:

### 1. Library survey (Node + browser)

For **Node**, survey Argon2id implementations:
- `argon2` (kelektiv/node-argon2) — historically dominant; native binding; uses libargon2
- `@node-rs/argon2` — Rust-native; napi-rs; faster builds; actively maintained
- Possibly others

Compare on: parameter set support, output format, recent commit cadence, dependency footprint, supported Node versions, bug history with respect to cross-runtime output reproducibility.

For **browser**, survey WASM Argon2id implementations:
- `argon2-browser` (antelle/argon2-browser) — long-running; WASM wrapper around libargon2
- `hash-wasm` — pure-WASM crypto suite that includes Argon2id; smaller bundle
- Custom wasm-pack-built from the reference implementation
- Possibly others

Compare on: bundle size, parameter set support, output format, browser compatibility, recent maintenance, output-equivalence track record vs the Node libs.

Recommend one Node library and one browser library. Justify the choice with respect to D3 (cross-runtime output equivalence) — this is the load-bearing correctness property; the recommendation must engage with whether the chosen pair has documented or empirically-verified bit-identical output.

### 2. Package structure

Specify the new packages:
- `@fgv/ts-extras-argon2` — name, scope, dependencies (the chosen Node lib), exported surface
- `@fgv/ts-web-extras-argon2` — name, scope, dependencies (the chosen browser lib), exported surface
- Rush.json + monorepo wiring: how the new packages register; review against existing patterns in `rush.json`

Note any concerns about API-surface consistency between the two packages (they should expose the same interface so consumers can swap based on runtime context).

### 3. Interface definition

Propose the `IArgon2idProvider` interface (or equivalent) exposed from `@fgv/ts-extras/crypto-utils` (so consumers can type against it without depending on the new packages):

```typescript
// in @fgv/ts-extras/crypto-utils
export interface IArgon2idProvider {
  argon2id(
    password: Uint8Array | string,
    salt: Uint8Array,
    params: IArgon2idParams
  ): Promise<Result<Uint8Array>>;
}

export interface IArgon2idParams {
  readonly memoryKiB: number;
  readonly iterations: number;
  readonly parallelism: number;
  readonly outputBytes: number;
}
```

Refine as needed. Document defaults / recommended values referencing OWASP and RFC 9106. Document parameter constraints and failure modes.

### 4. Composition idiom

Decide and document how consumers wire an `IArgon2idProvider` into the rest of the crypto-utils system. Options to consider:

- **(a)** `ICryptoProvider` gains an optional `argon2?: IArgon2idProvider` field; consumers pass it at construction. Default providers leave it undefined; calling `argon2id()` on a provider without it returns `Result.fail`.
- **(b)** `IArgon2idProvider` is fully standalone — consumers compose it explicitly into their own structures; `ICryptoProvider` doesn't know about it.
- **(c)** A new `ICryptoProviderWithArgon2id extends ICryptoProvider` interface from the argon2 packages; consumers depend on the more-specific interface where they need Argon2id.

Recommend one. Justify by thinking about how `KeyStore` (which currently uses PBKDF2 in `addSecretFromPassword`) would migrate to Argon2id. Pattern continuity with `KeyStore.addSecretFromPassword` is a goal; document the migration shape.

### 5. KeyStore integration

`KeyStore.addSecretFromPassword` currently uses PBKDF2. Argon2id is the natural successor (stronger memory-hardness). Propose:

- New method: `KeyStore.addSecretFromPasswordArgon2id(...)` ?
- Or: parameter to existing method selecting KDF?
- Or: leave `addSecretFromPassword` as-is; consumers needing Argon2id-backed entries roll their own KeyStore equivalent or use a lower-level path?
- Or defer to a follow-up stream entirely?

Recommend. Note that personaility's η-v2 wants Argon2id-backed entries; deferring means personaility uses Argon2id outside the KeyStore pattern (less ideal) or this stream extends KeyStore.

### 6. Cross-runtime equivalence test strategy

Concrete test strategy:
- What test vectors? (RFC 9106 provides; some chosen libraries provide additional)
- Parameter sweep dimensions: memoryKiB (try 4096, 19456, 65536), iterations (1, 2, 3), parallelism (1, 2), outputBytes (16, 32, 64). Cartesian product or representative subset?
- Cross-runtime test harness — Jest can run Node tests, but browser test execution needs a different runner. What's the existing fgv pattern? Check `ts-web-extras` test setup for how browser-side tests run; the strategy should fit it.
- Pass/fail criterion: bit-identical output bytes. Any tolerance is wrong.

### 7. Parameter recommendations

Document recommended parameters for personaility's two use cases:
- **Recovery row** (256-bit BIP39 phrase → key): the phrase is high-entropy, so per-attempt cost can be moderate. OWASP baseline (memoryKiB=19456, iterations=2, parallelism=1, outputBytes=32) probably fits.
- **Hybrid auth passphrase** (user-typed passphrase → master): user entropy is the floor; per-attempt cost must be high enough to deter brute-force given likely passphrase strength. Recommendations TBD.

These recommendations are guidance for personaility-side application code — fgv's wrapper exposes the parameters; the application picks values. But the design should document reasonable starting points.

### 8. Version-sync strategy

Per D4, fgv concentrates the version-sync responsibility. Document:
- Whether the chosen Node + browser libraries have any history of breaking-change releases requiring careful consumer-side migration
- Where version pinning lives (the packages' own `package.json`)
- Recommendation on whether to use Rush's preferred-versions feature to lock the upstream library version across the monorepo
- Suggested cadence for re-checking upstream library versions (e.g. quarterly + on security advisory)

### 9. Migration impact

- The new packages are net-additions; consumers who don't add them don't see any change
- `ICryptoProvider`-shape change (D2's composition idiom) — does it break existing consumers? If a new optional field, no. If a wider change, document blast radius.
- `KeyStore` change (§5) — if it gains a new method or new parameter, document migration shape

Lockstep version policy reminder: even purely-additive changes ship in every consumer's next alpha; weigh the surface growth.

### 10. Open questions for signoff

Anything the design surfaces that needs orchestrator/user input before phase B.

---

## Package surface (read-only for phase A)

Phase A reads but does not modify:
- `libraries/ts-extras/src/packlets/crypto-utils/` — current Node implementation, especially `KeyStore` (PBKDF2 reference), `nodeCryptoProvider.ts`, `model.ts`
- `libraries/ts-web-extras/src/packlets/crypto-utils/` — current Browser implementation
- `.ai/instructions/LIBRARY_CAPABILITIES.md` § crypto-utils
- `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md`
- `rush.json` and `common/config/rush/` — to understand package-registration patterns

Phase A writes only:
- `.ai/tasks/active/crypto-batch-2-argon2id/design.md` (new)
- `.ai/tasks/active/crypto-batch-2-argon2id/state.md` (update at checkpoints)

Phase B (separately commissioned) will create the new packages, modify the `ICryptoProvider` interface per D2's chosen composition shape, possibly modify `KeyStore`, write the cross-runtime equivalence test suite, and update `LIBRARY_CAPABILITIES.md`.

---

## Required reading (priority order)

1. `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md` — consumer context
2. `libraries/ts-extras/src/packlets/crypto-utils/keyStore.ts` (or wherever `KeyStore` lives) — current PBKDF2 pattern; the pattern Argon2id should preserve continuity with
3. `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` — Node implementation patterns
4. `libraries/ts-extras/src/packlets/crypto-utils/model.ts` — `ICryptoProvider` interface, type definitions
5. `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` — Browser implementation patterns
6. `rush.json` — package-registration pattern
7. `docs/WORKSTREAMS.md` preamble — repo shape, lockstep policy
8. `.ai/instructions/MONOREPO_GUIDE.md` — Rush conventions, package addition workflow
9. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `crypto-utils` is on the active list
10. `.ai/instructions/LIBRARY_CAPABILITIES.md` § crypto-utils
11. RFC 9106 (Argon2) — section 4 (parameter recommendations), section 5 (test vectors)
12. OWASP Password Storage Cheat Sheet — current Argon2id parameter recommendations

---

## Skills to load (when conditions trigger)

- `/published-primitives-reflex` — load before any utility-shaped helper. Check `@fgv/*` first.
- `/result-pattern` — load before proposing function signatures returning `Result<T>`.
- `/type-safe-validation` — load if input-validation (e.g. parameter validation) surfaces.

---

## Web access

You may web-search and web-fetch:
- npm packages and their READMEs for the candidate libraries
- RFC 9106
- OWASP password-storage recommendations
- Any documented cross-runtime output-equivalence reports for the candidate library pairs

Cite URLs.

---

## Missing-input rule

If a required-reading file is missing, has a shape that conflicts with this brief, or if research surfaces a structural mismatch (e.g. one of the candidate libraries has a deal-breaker bug or licensing issue), **STOP and report**. Do not improvise around it; the library choice is load-bearing.

---

## Phase A acceptance criteria

- [ ] `design.md` exists at the specified path with all ten sections populated
- [ ] Node + browser library choices recommended with justification (especially output-equivalence)
- [ ] Package structure specified including Rush wiring concerns
- [ ] Interface and composition idiom proposed and defended
- [ ] KeyStore integration recommendation made
- [ ] Cross-runtime test strategy concrete (vectors, parameter sweep, runner)
- [ ] Parameter recommendations for both personaility use cases
- [ ] Version-sync strategy outlined

---

## Phase A exit artifact (state.md)

At completion, `state.md` should record:
- Phase A done; Phase B awaiting signoff
- `design.md` path
- Recommendation summary (one paragraph)
- Any research dead-ends, library deal-breakers, or surprising findings
- Anything decided to exclude and why

---

## Branch + PR posture

- **Base branch:** `claude/crypto-batch-2-features`
- **Work branch:** `claude/crypto-batch-2-argon2id-design` (or harness-auto-suffix; document actual name in state.md)
- **PR target:** `claude/crypto-batch-2-features`
- Single PR containing `design.md` + updated `state.md`. No production code.

---

## Resume protocol

If the session ends mid-phase: read `brief.md` (this file) and `state.md` to resume.

---

## Out of scope (both phases)

- PBKDF2 (already shipped via `KeyStore.addSecretFromPassword`)
- Other KDFs (scrypt, bcrypt, etc.) — Argon2id only
- HPKE, WebAuthn, sign/verify, timingSafeEqual — parallel streams
- Argon2i, Argon2d — Argon2id only (memory-hard variant is the right one for the use cases)
- Higher-level password-policy enforcement (entropy minimum checks, etc.) — application-level
- Sudoku packages
