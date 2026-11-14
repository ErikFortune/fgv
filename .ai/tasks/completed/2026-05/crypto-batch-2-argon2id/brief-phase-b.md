# Stream Brief: crypto-batch-2-argon2id (phase B — implementation)

**Stream ID:** crypto-batch-2-argon2id
**Phase:** B — implementation
**Sequencing:** Phase A signed off. Phase B can run in parallel with `crypto-batch-2-hpke` and `crypto-batch-2-webauthn` phase B. Minor potential file collision with HPKE on `@fgv/ts-extras/crypto-utils/model.ts` (Argon2id adds the `IArgon2idProvider` + `IArgon2idParams` + `IKeyDerivationParams` discriminated union; HPKE doesn't need model.ts edits — collision risk is low and handled by file-level discipline below).

---

## Context

Phase A produced `.ai/tasks/active/crypto-batch-2-argon2id/design.md` (read it in full — library survey + composition rationale + KeyStore integration design). Orchestrator/user signed off **as designed** with two resolutions on Open Questions:

- **Q1 (parameter naming):** keep the readable form (`memoryKiB`, `iterations`, `parallelism`, `outputBytes`). Do NOT collapse to RFC's `m`/`t`/`p`.
- **Q2 (parallelism > 1 on WASM):** JSDoc warning is sufficient — no runtime logged warning needed.

Plus one orchestrator-flagged precondition (ARGON-1): live `hash-wasm` repository activity check at phase B step zero.

**This brief is the binding contract** — where it conflicts with `design.md`, this brief wins.

This is feature work on an active-development surface (new packages `@fgv/ts-extras-argon2` and `@fgv/ts-web-extras-argon2`, plus model additions in `@fgv/ts-extras/crypto-utils`). Per `.ai/instructions/ACTIVE_DEVELOPMENT.md`, free hand on breaking changes.

---

## Mission

Ship two new monorepo packages — `@fgv/ts-extras-argon2` (Node, wraps `argon2`) and `@fgv/ts-web-extras-argon2` (Browser + Node-compatible, wraps `hash-wasm`) — implementing a shared `IArgon2idProvider` interface defined in `@fgv/ts-extras/crypto-utils/model.ts`. Extend `KeyStore` with `addSecretFromPasswordArgon2id` / `verifySecretFromPasswordArgon2id`. Convert `IKeyDerivationParams` to a discriminated union. 100% test coverage, lint pass, `LIBRARY_CAPABILITIES.md` update, pre-merge artifact migration.

---

## Signed-off design decisions (binding)

The decisions baked into `design.md` stand unless overridden below.

### D1. Library choices (design §1)

- Node: **`argon2` v0.45.0+** (kelektiv/ranisalt). Default variant is `argon2id`. Raw bytes via `raw: true`. Node ≥ 22 matches repo's `nodeSupportedVersionRange`.
- Browser (and Node test-side equivalence): **`hash-wasm` v4.12.0+**. Pure WASM — runs identically in both runtimes. `outputType: 'binary'` → `Uint8Array`.

Rejected: `@node-rs/argon2` (no raw or PHC output); `argon2-browser` (effectively abandoned).

### D2. Package structure (design §2)

Two new packages registered in `rush.json` under `libraries/`:

- `libraries/ts-extras-argon2/` — `@fgv/ts-extras-argon2`, depends on `@fgv/ts-extras`, `@fgv/ts-utils`, `argon2`.
- `libraries/ts-web-extras-argon2/` — `@fgv/ts-web-extras-argon2`, depends on `@fgv/ts-extras`, `@fgv/ts-utils`, `hash-wasm`. **Does NOT depend on `@fgv/ts-web-extras`** — `hash-wasm` has no Web Crypto coupling, so the browser package can stand alone.

Both `shouldPublish: true`, `versionPolicyName: "base-utils"`, `tags: ["libraries"]`.

Class names follow the existing convention: `NodeArgon2Provider` and `BrowserArgon2Provider` (parallels `NodeCryptoProvider` / `BrowserCryptoProvider`).

### D3. Interface shape (design §3, Q1 resolved)

Add to `@fgv/ts-extras/src/packlets/crypto-utils/model.ts`:

```typescript
export interface IArgon2idParams {
  readonly memoryKiB: number;     // OWASP 2023 min: 19456 (19 MiB). Constraint: >= 8.
  readonly iterations: number;    // OWASP min: 2. Constraint: >= 1.
  readonly parallelism: number;   // 1..255. WASM path computes sequentially but value affects output bytes.
  readonly outputBytes: number;   // typical 32 (AES-256 key). Constraint: >= 4.
}

export const ARGON2ID_OWASP_MIN: IArgon2idParams = {
  memoryKiB: 19456, iterations: 2, parallelism: 1, outputBytes: 32
} as const;

export const ARGON2ID_PASSPHRASE: IArgon2idParams = {
  memoryKiB: 65536, iterations: 3, parallelism: 1, outputBytes: 32
} as const;

export interface IArgon2idProvider {
  argon2id(
    password: Uint8Array | string,
    salt: Uint8Array,
    params: IArgon2idParams
  ): Promise<Result<Uint8Array>>;
}
```

Parameter naming locked to the readable form (signoff Q1). Do NOT rename to RFC's `m`/`t`/`p`.

Class shape follows the fgv factory pattern — private constructor + static `create(...): Result<NodeArgon2Provider>` (or `BrowserArgon2Provider`). Use `captureResult(() => new ...)`. The classes don't take constructor arguments today; if `hash-wasm` ever requires init plumbing, surface as state.md decision.

### D4. `IKeyDerivationParams` becomes a discriminated union (design §3, Q3)

Replace the existing single shape with:

```typescript
export interface IPbkdf2KeyDerivationParams {
  readonly kdf: 'pbkdf2';
  readonly salt: string;        // base64
  readonly iterations: number;
}

export interface IArgon2idKeyDerivationParams {
  readonly kdf: 'argon2id';
  readonly salt: string;        // base64
  readonly memoryKiB: number;
  readonly iterations: number;
  readonly parallelism: number;
}

export type IKeyDerivationParams =
  | IPbkdf2KeyDerivationParams
  | IArgon2idKeyDerivationParams;

export type KeyDerivationFunction = 'pbkdf2' | 'argon2id';
```

**Migration impact** (design §9 — verify in phase B):
- `keystore/converters.ts` — the `IKeyDerivationParams` converter must handle both union arms. This is the main code-change site.
- `verifySecretFromPassword()` — its existing `if (keyDerivation.kdf !== 'pbkdf2') return fail(...)` guard becomes the narrowing expression. No logic change.
- `keyStore.ts` `unlock()` — `keyDerivation.iterations` access remains valid (both arms have `iterations`).

The discriminated-union arms share `kdf` and `salt`; narrowing is additive. Audit + verify, don't speculate.

### D5. Composition idiom (design §4) — option (b): standalone `IArgon2idProvider`

- `ICryptoProvider` does **not** know about Argon2id.
- `IArgon2idProvider` is a fully independent interface.
- `KeyStore` methods that need Argon2id take an `IArgon2idProvider` as an explicit parameter (D6 below).
- Consumers compose: instantiate `NodeArgon2Provider` (or `BrowserArgon2Provider`) themselves and pass it in.

Rejected: optional field on `ICryptoProvider`; extends-shape; generalizing `addSecretFromPassword` with a `kdf?` parameter.

### D6. `KeyStore` integration (design §5) — two new dedicated methods

Add to `KeyStore`:

```typescript
public async addSecretFromPasswordArgon2id(
  name: string,
  password: string,
  argon2idProvider: IArgon2idProvider,
  options?: IAddSecretFromPasswordArgon2idOptions
): Promise<Result<IAddSecretFromPasswordResult>>;

public async verifySecretFromPasswordArgon2id(
  name: string,
  password: string,
  argon2idProvider: IArgon2idProvider,
  keyDerivation: IArgon2idKeyDerivationParams
): Promise<Result<boolean>>;
```

Where:

```typescript
export interface IAddSecretFromPasswordArgon2idOptions {
  readonly params?: IArgon2idParams;    // defaults to ARGON2ID_OWASP_MIN
  readonly description?: string;
  readonly replace?: boolean;
}
```

Reuse `IAddSecretFromPasswordResult`; its `keyDerivation` field is typed as the discriminated union (D4) — Argon2id callers get `IArgon2idKeyDerivationParams` back. Constant-time comparison in verify (use the existing helper).

Do NOT generalize `addSecretFromPassword` with a `kdf?` discriminator. The two-method shape makes the KDF choice explicit and audit-traceable (design §5 rejection reasoning).

### D7. Cross-runtime equivalence test placement (design §6, Q5 resolved)

The cross-runtime equivalence test lives **in `libraries/ts-extras-argon2/`** with a `devDependency` on `@fgv/ts-web-extras-argon2`. `hash-wasm` is pure WASM and runs identically under Node and browsers, so the test is a **plain Jest test** running in Node — **no browser runner needed**. The unusual cross-package devDependency is acceptable; document it in the test file's header comment.

If the cross-package devDependency causes a Rush dependency-cycle complaint, fall back to placing the cross-runtime test in `libraries/ts-web-extras-argon2/` instead (it can import `@fgv/ts-extras-argon2` as a devDependency). Either direction works; surface the resolution in state.md.

### D8. JSDoc-only warning for `parallelism > 1` on WASM (Q2 resolved)

`BrowserArgon2Provider.argon2id`'s JSDoc explicitly notes:

- WASM computes sequentially regardless of `parallelism`.
- The `parallelism` value IS still wired into the hash; output bytes differ for different values.
- Recommendation: use `parallelism: 1` unless interoperating with a server-side derivation that uses a different value.

**No runtime logged warning** — JSDoc is the contract.

### D9. Test vectors (design §6)

- RFC 9106 Appendix B test vector for Argon2id v1.3 (`password` / `somesalt`, m=32, t=3, p=4, hashLength=32). Phase B implementer copies the exact hex from RFC 9106 §B.3 directly — do not transcribe from the design (which contained a placeholder).
- Parameter sweep covering: OWASP min, OWASP stronger, low-memory boundary, min-iterations, parallelism > 1, output 16 / 32 / 64 (design §6 sweep table).
- Pass/fail criterion: byte-identical output (`expect(Array.from(nodeBytes)).toEqual(Array.from(browserBytes))`).

---

## Phase B step zero (B.0) — live `hash-wasm` activity check (orchestrator-flagged)

The design's library survey records `hash-wasm` last published November 2024 (~6 months at design time). The orchestrator condition is non-optional:

1. Fetch `https://github.com/Daninet/hash-wasm` (or `https://www.npmjs.com/package/hash-wasm`).
2. Check most recent commit / release date and open-issue count.
3. **If maintenance has materially deteriorated** (e.g. unresolved security-relevant issues, last commit > 12 months, maintainer publicly inactive), STOP and surface to the orchestrator. Do NOT pivot to `argon2-browser` unilaterally — the orchestrator may want to re-scope or hold the stream.
4. If maintenance is steady (low issues are fine — `hash-wasm` is a low-activity, focused library), proceed with `hash-wasm` per D1.
5. Record the activity-check outcome in `state.md` (Decisions log).

---

## Phase B implementation phases

### B.1 — Model additions in `@fgv/ts-extras`

In `libraries/ts-extras/src/packlets/crypto-utils/model.ts`:

- Add `IArgon2idParams`, `ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE`, `IArgon2idProvider` (D3)
- Convert `IKeyDerivationParams` to the discriminated union (D4)
- Update `KeyDerivationFunction` to `'pbkdf2' | 'argon2id'`

Audit and update `keystore/converters.ts` to handle both union arms. Audit `keyStore.ts` for any `IKeyDerivationParams` access sites; verify each compiles and is semantically correct under the new union. Run `rushx build && rushx lint && rushx test` in `ts-extras` to confirm the model changes pass before moving on.

**Checkpoint:** `ts-extras` compiles + lints + tests pass with new model surface (Argon2id provider impl not yet present; existing PBKDF2 paths still 100% covered).

### B.2 — Create `@fgv/ts-extras-argon2`

- `rush add` is for adding deps to an existing package; for a new package, follow the existing pattern: copy the structure of a small existing package (e.g. `libraries/ts-bcp47` or another minimal lib) and modify, then run `rush update`.
- New package contents per design §2.
- `NodeArgon2Provider` class with private constructor + static `create()`. `argon2id` method wraps the upstream `argon2.hash(password, { type: argon2.argon2id, salt, memoryCost: params.memoryKiB, timeCost: params.iterations, parallelism: params.parallelism, hashLength: params.outputBytes, raw: true })` inside `captureAsyncResult`, returning `Result<Uint8Array>`.
- Parameter validation (per design §3 "Parameter Constraints"): `memoryKiB >= 8`, `iterations >= 1`, `parallelism` in `1..255`, `outputBytes >= 4`. Failure messages prefixed `argon2id:`.
- Re-export `IArgon2idProvider` and `IArgon2idParams` from `@fgv/ts-extras` for consumer convenience (per design §2 "Exported surface").
- Register in `rush.json`.
- Add per-package `tsconfig.json`, `jest.config.json`, `package.json`, `README.md` (stub OK — README content can be added at B.6).

**Checkpoint:** `@fgv/ts-extras-argon2` builds, lints, and has at least roundtrip + RFC-vector tests passing with 100% coverage of its own code.

### B.3 — Create `@fgv/ts-web-extras-argon2`

- Same structure as B.2.
- `BrowserArgon2Provider` class with private constructor + static `create()`. `argon2id` method wraps `hash-wasm.argon2id({ password, salt, iterations: params.iterations, parallelism: params.parallelism, memorySize: params.memoryKiB, hashLength: params.outputBytes, outputType: 'binary' })` inside `captureAsyncResult`, returning `Result<Uint8Array>`.
- JSDoc on `argon2id` per D8: WASM is sequential, parallelism still affects bytes, recommend `parallelism: 1`.
- Parameter validation identical to Node path (D3).
- Re-export `IArgon2idProvider`, `IArgon2idParams` from `@fgv/ts-extras` for consumer convenience.
- Register in `rush.json`.

**Checkpoint:** `@fgv/ts-web-extras-argon2` builds, lints, and has roundtrip + RFC-vector tests passing with 100% coverage.

### B.4 — KeyStore extension

In `libraries/ts-extras/src/packlets/crypto-utils/keystore/`:

- Add `addSecretFromPasswordArgon2id` and `verifySecretFromPasswordArgon2id` methods per D6.
- Existing `verifySecretFromPassword` keeps its `if (keyDerivation.kdf !== 'pbkdf2') return fail(...)` guard — that's the narrowing expression now.
- Tests in `keystore` test suite: derivation roundtrip; verify happy path; verify wrong-password path; replace flag; storage of `IArgon2idKeyDerivationParams` in entries.
- For these tests, instantiate `NodeArgon2Provider` from `@fgv/ts-extras-argon2`. This makes `@fgv/ts-extras-argon2` a `devDependency` of `@fgv/ts-extras` for tests. If that creates a Rush dependency-cycle warning, instead use a minimal in-test mock `IArgon2idProvider` that returns deterministic bytes — surface the choice in state.md.

**Checkpoint:** KeyStore has 100% coverage for both Argon2id methods; the existing PBKDF2 paths remain at 100% coverage.

### B.5 — Cross-runtime equivalence test

Per D7. New test file in `libraries/ts-extras-argon2/src/test/unit/crossRuntime.test.ts` (or equivalent path). Imports both `NodeArgon2Provider` and `BrowserArgon2Provider`. For each test vector + the parameter sweep, asserts byte-identical output:

```typescript
const nodeBytes = (await nodeProvider.argon2id(password, salt, params)).orThrow();
const browserBytes = (await browserProvider.argon2id(password, salt, params)).orThrow();
expect(Array.from(nodeBytes)).toEqual(Array.from(browserBytes));
```

Document at the top of the file why the cross-package devDependency exists (link this brief).

**Checkpoint:** All test vectors + sweep cases produce byte-identical output across providers.

### B.6 — Documentation

Update `.ai/instructions/LIBRARY_CAPABILITIES.md`:

- Add new decision shortcut: **"Need to derive a key from a password using Argon2id (RFC 9106)?"** → `NodeArgon2Provider` from `@fgv/ts-extras-argon2` (Node) or `BrowserArgon2Provider` from `@fgv/ts-web-extras-argon2` (browser, also runs in Node for tests). Both implement `IArgon2idProvider` from `@fgv/ts-extras/crypto-utils`. Use `ARGON2ID_OWASP_MIN` as starting params; `ARGON2ID_PASSPHRASE` for user-typed passphrases.
- Add **"Need to back a password-protected KeyStore entry with Argon2id?"** → `KeyStore.addSecretFromPasswordArgon2id(name, password, argon2idProvider, { params })` / `verifySecretFromPasswordArgon2id(...)`.
- Update the `crypto-utils` packlet entry to mention `IArgon2idProvider`, `IArgon2idParams`, `ARGON2ID_OWASP_MIN`/`PASSPHRASE`, and the new KeyStore methods. Mention the discriminated `IKeyDerivationParams` union.
- Update the package table at the top of the doc to add the two new packages.
- Update the cross-runtime interfaces table to add `IArgon2idProvider` (Node impl: `NodeArgon2Provider`, Browser impl: `BrowserArgon2Provider`).

Regenerate api-extractor for `ts-extras`, `ts-extras-argon2`, `ts-web-extras-argon2`.

Polish each new package's `README.md` with usage examples and the `IArgon2idProvider` interface link.

**Checkpoint:** docs reflect implementation; api-extractor regenerated.

### B.7 — Pre-merge artifact migration

Migrate `.ai/tasks/active/crypto-batch-2-argon2id/` → `.ai/tasks/completed/2026-05/crypto-batch-2-argon2id/`. Write a **separate polished `README.md`** capturing:

- What shipped (two new packages, `IArgon2idProvider`, KeyStore methods, discriminated union)
- Key decisions (library choices; package split; standalone interface; cross-runtime via pure WASM)
- B.0 `hash-wasm` activity-check outcome
- Acceptance status
- Followups: TECH_DEBT / FUTURE candidates

Pre-merge migration is mandatory per `.ai/conventions/workflow/artifact-protocol.md`. **Separate polished README.md** — not just the migrated state.md.

---

## Package surface

### In-scope (modify / create)

- `libraries/ts-extras/src/packlets/crypto-utils/model.ts` — add types per D3, convert `IKeyDerivationParams` to union per D4
- `libraries/ts-extras/src/packlets/crypto-utils/keystore/converters.ts` — handle both union arms
- `libraries/ts-extras/src/packlets/crypto-utils/keystore/keyStore.ts` — add `addSecretFromPasswordArgon2id` and `verifySecretFromPasswordArgon2id`
- `libraries/ts-extras/etc/ts-extras.api.md` — regenerate
- `libraries/ts-extras/src/test/unit/crypto/keystore.test.ts` (or wherever the KeyStore tests live) — new cases for Argon2id paths
- `libraries/ts-extras-argon2/` — new package (full structure per design §2)
- `libraries/ts-web-extras-argon2/` — new package (full structure per design §2)
- `rush.json` — register both new packages
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — new decision shortcuts + entries
- `.ai/tasks/active/crypto-batch-2-argon2id/state.md` — checkpoint updates
- Pre-merge: migrate `.ai/tasks/active/crypto-batch-2-argon2id/` → `.ai/tasks/completed/2026-05/crypto-batch-2-argon2id/` with polished `README.md`

### Out-of-scope

- `ICryptoProvider` modifications (Argon2id is standalone; D5)
- Generalization of `addSecretFromPassword` with `kdf?` parameter (rejected in D6)
- HPKE, WebAuthn surfaces (parallel streams)
- Browser smoke test via `apps/ts-utils-browser-test` (optional per design §6; skip unless something forces it)
- Sudoku packages

### Parallel-stream awareness

HPKE phase B introduces a new file in `crypto-utils/` (`hpkeProvider.ts`) and only modifies `crypto-utils/index.ts`. Argon2id modifies `crypto-utils/model.ts` and `crypto-utils/keystore/`. Direct file collisions are unlikely. If both streams independently want to edit `crypto-utils/index.ts` (HPKE: add `HpkeProvider` export; Argon2id: re-export new Argon2id types via the index), use checkpoint discipline and a clean rebase. Coordinate via state.md if a real conflict surfaces.

---

## Required reading (priority order)

1. `.ai/tasks/active/crypto-batch-2-argon2id/brief-phase-b.md` (this file) — binding contract
2. `.ai/tasks/active/crypto-batch-2-argon2id/design.md` — phase A inventory + composition rationale
3. `.ai/tasks/active/crypto-batch-2-argon2id/brief.md` — phase A contract
4. `.ai/notes/cross-repo-handoffs/fgv-batch-2-handoff-2026-05.md` — consumer context (recovery rows + passphrase rows)
5. `libraries/ts-extras/src/packlets/crypto-utils/keystore/` — existing PBKDF2 paths, factory pattern, `IKeyDerivationParams` consumer sites
6. `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` and `browserCryptoProvider.ts` — class-with-create-factory shape; naming pattern
7. `rush.json` and an existing small library's `package.json` / `tsconfig.json` / `jest.config.json` (e.g. `libraries/ts-bcp47`) — new-package boilerplate template
8. RFC 9106 (Argon2id) — at least §3.1 (algorithm) and §B (test vectors); skim §4 (parameter selection)
9. `argon2` npm docs (https://github.com/ranisalt/node-argon2) — confirm parameter names + `raw: true` behavior
10. `hash-wasm` docs (https://github.com/Daninet/hash-wasm) — confirm `argon2id()` API + `outputType: 'binary'`
11. `.ai/instructions/CODING_STANDARDS.md` § Pre-PR Validation Checklist — lint discipline
12. `.ai/instructions/TESTING_GUIDELINES.md` — Result matchers, 100% coverage

---

## Skills to load (when conditions trigger)

- `/result-pattern` — load before writing any function returning `Result<T>` (all public methods)
- `/result-tests` — load before writing tests
- `/type-safe-validation` — load when implementing parameter validation in `IArgon2idProvider.argon2id`
- `/published-primitives-reflex` — load before writing utility helpers

---

## Acceptance criteria

- [ ] B.0 `hash-wasm` activity-check outcome captured in state.md
- [ ] `IArgon2idProvider`, `IArgon2idParams`, `ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE` added to `model.ts`
- [ ] `IKeyDerivationParams` converted to discriminated union; `keystore/converters.ts` updated to handle both arms
- [ ] `NodeArgon2Provider` shipped in `@fgv/ts-extras-argon2` with private constructor + static `create` factory
- [ ] `BrowserArgon2Provider` shipped in `@fgv/ts-web-extras-argon2` with private constructor + static `create` factory
- [ ] `KeyStore.addSecretFromPasswordArgon2id` and `verifySecretFromPasswordArgon2id` implemented
- [ ] Cross-runtime byte-identical output verified for the RFC 9106 §B.3 vector + the parameter sweep (design §6)
- [ ] `parallelism > 1` JSDoc warning present on `BrowserArgon2Provider.argon2id`
- [ ] `rushx build` passes in `ts-extras`, `ts-extras-argon2`, `ts-web-extras-argon2`
- [ ] **`rushx lint` passes in all modified packages** (load-bearing — NOT transitively run by build; see CODING_STANDARDS § Pre-PR Validation Checklist)
- [ ] `rushx test` passes with 100% coverage in all modified packages
- [ ] **`rushx fixlint` was run before the final commit**
- [ ] No `any` types; all fallible operations return `Result<T>`
- [ ] No inline lint-rule-disable directives added to make lint pass
- [ ] api-extractor regenerated (`ts-extras.api.md`, `ts-extras-argon2.api.md`, `ts-web-extras-argon2.api.md`)
- [ ] `LIBRARY_CAPABILITIES.md` updated with new decision shortcuts + packlet entry + package table + cross-runtime table
- [ ] Pre-merge artifact migration to `.ai/tasks/completed/2026-05/crypto-batch-2-argon2id/` with **separate polished README.md**
- [ ] PR opened against `claude/crypto-batch-2-features` (NOT `release`)

---

## Branch + PR posture

- **Base branch:** `claude/crypto-batch-2-features` (cluster integration)
- **Work branch:** `claude/crypto-batch-2-argon2id-impl` (or harness-auto-suffix; document the actual branch in state.md)
- **PR target:** `claude/crypto-batch-2-features`
- One PR for all of B.0–B.7 unless something forces a split.

---

## Don't

- Don't open the PR until `rushx build && rushx lint && rushx test` all pass locally. `rushx build` does NOT transitively run lint; lint is a separate gate. Run `rushx fixlint` before the final commit.
- Don't add Argon2id to `ICryptoProvider` — standalone interface only (D5).
- Don't generalize `addSecretFromPassword` with a `kdf?` parameter — two-method shape (D6).
- Don't rename `IArgon2idParams` fields to RFC's `m`/`t`/`p` — readable form locked (D3 / Q1).
- Don't add a runtime logged warning for `parallelism > 1` on WASM — JSDoc only (D8 / Q2).
- Don't pivot to `argon2-browser` unilaterally if `hash-wasm` activity check shows mild slowness — surface to orchestrator (B.0).
- Don't add `@fgv/ts-web-extras` as a dependency of `@fgv/ts-web-extras-argon2` — it's not needed (D2).
- Don't skip B.0. The orchestrator condition stands.

---

## Resume protocol

If the session ends mid-phase: read `brief-phase-b.md` (this file), `design.md`, and `state.md` to resume. State.md records which checkpoints (B.0–B.7) are done.

---

## Missing-input rule

If a required-reading file is missing or has a shape that conflicts with this brief, or if B.0 activity-check finds `hash-wasm` materially deteriorated, **STOP and report**. Do not improvise.
