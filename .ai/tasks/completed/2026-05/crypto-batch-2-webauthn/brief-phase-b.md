# Stream Brief: crypto-batch-2-webauthn (phase B — implementation)

**Stream ID:** crypto-batch-2-webauthn
**Phase:** B — implementation
**Sequencing:** Phase A signed off. Phase B can run in parallel with `crypto-batch-2-hpke` and `crypto-batch-2-argon2id` phase B (no file collision — WebAuthn creates two new packages and touches `LIBRARY_CAPABILITIES.md`; that file is also touched by the other two streams, handled by simple section-level discipline).

---

## Context

Phase A produced `.ai/tasks/active/crypto-batch-2-webauthn/design.md` (read it in full — library survey + six-primitive surface + type re-export discipline + abstraction-rejection log). Orchestrator/user signed off **as designed**: six primitive Result-integration wrappers, nothing else.

The design's open questions resolve as follows:

- **OQ-1 (libraries/ vs integrations/):** stay in `libraries/`. The `integrations/` convention question is a separate lessons-codification chore.
- **OQ-2 (v12 support):** v13+ only. Do not include `@simplewebauthn/types`.
- **OQ-3 (`VerifyRegistrationResponseOpts` naming):** accept the namespace duplication risk; `Parameters<>` alias guarantees structural identity.
- **OQ-4 (rejected abstractions):** the four temptations stay rejected. No challenge generator helper, no PRF salt helper, no autofill input validator, no `WebAuthnCredential` builder.

**This brief is the binding contract** — where it conflicts with `design.md`, this brief wins.

This is feature work on an active-development surface (two brand-new packages). Per `.ai/instructions/ACTIVE_DEVELOPMENT.md`, free hand on breaking changes.

---

## Mission

Ship two new monorepo packages — `@fgv/ts-extras-webauthn` (Node, wraps `@simplewebauthn/server`) and `@fgv/ts-web-extras-webauthn` (browser, wraps `@simplewebauthn/browser`). Each exports its primitives as `Promise<Result<T>>` via `captureAsyncResult` over the unmodified upstream functions. Six primitives total, no abstraction beyond the boundary. 100% test coverage via `jest.mock` of upstream, lint pass, `LIBRARY_CAPABILITIES.md` update, pre-merge artifact migration.

---

## Signed-off design decisions (binding)

The decisions baked into `design.md` stand unless overridden below.

### D1. Six primitives — nothing else (design §1, §7)

| Package | Function | Return |
|---|---|---|
| `@fgv/ts-extras-webauthn` | `generateRegistrationOptions(opts)` | `Promise<Result<PublicKeyCredentialCreationOptionsJSON>>` |
| `@fgv/ts-extras-webauthn` | `verifyRegistrationResponse(opts)` | `Promise<Result<VerifiedRegistrationResponse>>` |
| `@fgv/ts-extras-webauthn` | `generateAuthenticationOptions(opts)` | `Promise<Result<PublicKeyCredentialRequestOptionsJSON>>` |
| `@fgv/ts-extras-webauthn` | `verifyAuthenticationResponse(opts)` | `Promise<Result<VerifiedAuthenticationResponse>>` |
| `@fgv/ts-web-extras-webauthn` | `startRegistration(opts)` | `Promise<Result<RegistrationResponseJSON>>` |
| `@fgv/ts-web-extras-webauthn` | `startAuthentication(opts)` | `Promise<Result<AuthenticationResponseJSON>>` |

Each is a one-line `captureAsyncResult(() => upstream(options))`. No transformation of inputs, no rewrapping of outputs, no error-message prefix, no ceremony orchestration.

### D2. NOT-in-scope (design §7, OQ-4)

Do NOT add (these were considered and explicitly rejected):

- Challenge generator helper
- PRF salt helper / Uint8Array conversion helper
- `browserAutofillInput` validator / `autocomplete` attribute helper
- `WebAuthnCredential` builder from verification output
- Attestation policy presets
- Algorithm allowlist presets
- Challenge state management or challenge stores
- Session token issuance
- Registration or authentication ceremony orchestration
- Credential / user database abstractions

If you find yourself drafting any of these, **stop and surface to the orchestrator**. The Result-integration boundary is the whole product; abstraction creep is the failure mode.

### D3. Upstream version pin (design §6)

- `@simplewebauthn/server` — `^13.0.0` (caret) in `@fgv/ts-extras-webauthn`
- `@simplewebauthn/browser` — `^13.0.0` (caret) in `@fgv/ts-web-extras-webauthn`
- Add both to `common/config/rush/common-versions.json` `preferredVersions` with the `^13.0.0` range.
- v13+ only; do NOT take `@simplewebauthn/types` as a dependency (its content was inlined into the server/browser packages in v13).

### D4. Type re-export discipline (design §5)

Re-export only the types that appear directly in the wrapped function input/output signatures. Deeper types (transports, COSE algorithms, attestation formats, extension client inputs/outputs) are caller's problem — they import from `@simplewebauthn/*` directly if needed.

**Server package re-exports:**

```typescript
export type {
  GenerateRegistrationOptionsOpts,
  PublicKeyCredentialCreationOptionsJSON,
  VerifiedRegistrationResponse,
  GenerateAuthenticationOptionsOpts,
  PublicKeyCredentialRequestOptionsJSON,
  VerifiedAuthenticationResponse,
  WebAuthnCredential,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';

// Aliases for upstream-unnamed opts types (Parameters<> keeps them in sync automatically)
export type VerifyRegistrationResponseOpts = Parameters<typeof _verifyRegistrationResponse>[0];
export type VerifyAuthenticationResponseOpts = Parameters<typeof _verifyAuthenticationResponse>[0];
```

**Browser package re-exports:**

```typescript
export type {
  StartRegistrationOpts,
  RegistrationResponseJSON,
  StartAuthenticationOpts,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';
```

Use `Parameters<typeof fn>[0]` for any opts type the upstream doesn't export as a named alias. This is load-bearing for migration discipline (D3 / design §6): when upstream signatures change, the alias auto-updates.

### D5. Error format (design §4) — captureAsyncResult bare

No prefix. Upstream error messages are descriptive and self-identifying. Consumers wanting `"webauthn registration: <upstream>"` add it themselves via `.withErrorFormat()`. This is the correct layer for that concern.

### D6. Test strategy — `jest.mock` upstream entirely (design §9 step 4)

Do NOT use real `@simplewebauthn/*` calls in tests. `jest.mock('@simplewebauthn/server')` (or `'@simplewebauthn/browser'`) at the top of each test file. The thing being tested is the `captureAsyncResult` integration, not the upstream's WebAuthn ceremony correctness.

Minimum 2 tests per primitive: success path (upstream resolves → `Success`) and failure path (upstream rejects → `Failure` with upstream message captured). 12 tests minimum across both packages.

### D7. Package location and naming (design §2)

- `libraries/ts-extras-webauthn/` — `@fgv/ts-extras-webauthn`
- `libraries/ts-web-extras-webauthn/` — `@fgv/ts-web-extras-webauthn`

Both `shouldPublish: true`, `versionPolicyName: "base-utils"`, `tags: ["libraries"]` (browser package also tagged `"browser"` per design §2).

Browser package uses `testEnvironment: "jsdom"` in `config/jest.config.json` (matches `ts-web-extras`). Server package uses node test environment.

`@fgv/heft-dual-rig` for both — same rig pattern as ts-extras / ts-web-extras.

### D8. Flat structure — no packlets (design §9 step 2/3)

Each package is a single `src/index.ts` file. No packlets, no internal subdirectories beyond `src/test/unit/`. The packages are single-purpose boundaries; flat structure is appropriate.

---

## Phase B implementation phases

### B.1 — Scaffold both packages

1. Register both packages in `rush.json` (entries per design §2).
2. Create `libraries/ts-extras-webauthn/` tree:
   - `package.json` — name `@fgv/ts-extras-webauthn`; dependencies `@simplewebauthn/server: ^13.0.0`, `@fgv/ts-utils: workspace:*`; peerDependencies `@fgv/ts-utils`; devDependencies mirror ts-utils-jest / ts-extras patterns (heft, jest, etc.).
   - `tsconfig.json` extending node rig
   - `config/rig.json` → `@fgv/heft-dual-rig`
   - `config/jest.config.json` with 100% coverage threshold; node test environment
   - `config/api-extractor.json` (copy from existing small library)
   - `CHANGELOG.json` (empty initial)
3. Create `libraries/ts-web-extras-webauthn/` tree with the same shape but:
   - `package.json` depends on `@simplewebauthn/browser: ^13.0.0`
   - `config/jest.config.json` uses `testEnvironment: "jsdom"`
4. Add `preferredVersions` entries to `common/config/rush/common-versions.json`.
5. Run `rush update` and confirm both packages install cleanly.

**Checkpoint:** `rush install` + `rush build` succeeds for both packages (empty src is fine at this checkpoint).

### B.2 — Server package implementation

Single file: `libraries/ts-extras-webauthn/src/index.ts`. Implementation exactly as design §3 (server section):

```typescript
import {
  generateRegistrationOptions as _generateRegistrationOptions,
  verifyRegistrationResponse as _verifyRegistrationResponse,
  generateAuthenticationOptions as _generateAuthenticationOptions,
  verifyAuthenticationResponse as _verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

// type re-exports (per D4)

export async function generateRegistrationOptions(
  options: GenerateRegistrationOptionsOpts
): Promise<Result<PublicKeyCredentialCreationOptionsJSON>> {
  return captureAsyncResult(() => _generateRegistrationOptions(options));
}
// ...three more analogous functions
```

JSDoc on each function: one short line stating "Result-integration wrapper around `@simplewebauthn/server`'s `<name>`. Returns `Promise<Result<T>>`; upstream errors are captured as `Failure` with the original message." Reference upstream docs URL.

Re-export the types per D4.

**Checkpoint:** `rushx build` + `rushx lint` pass.

### B.3 — Browser package implementation

Single file: `libraries/ts-web-extras-webauthn/src/index.ts`. Per design §3 (browser section). Two functions plus re-exports.

**Checkpoint:** `rushx build` + `rushx lint` pass.

### B.4 — Tests for both packages

`libraries/ts-extras-webauthn/src/test/unit/webauthn.test.ts` (server, 4 functions × ≥2 tests each).
`libraries/ts-web-extras-webauthn/src/test/unit/webauthn.test.ts` (browser, 2 functions × ≥2 tests each).

Per-primitive pattern (design §9 step 4):

```typescript
import { jest } from '@jest/globals';
jest.mock('@simplewebauthn/server');

import { generateRegistrationOptions } from '../index';
import * as upstream from '@simplewebauthn/server';

describe('generateRegistrationOptions', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  test('returns Success wrapping upstream result on success', async () => {
    const mockResult = { /* shape */ } as PublicKeyCredentialCreationOptionsJSON;
    jest.mocked(upstream.generateRegistrationOptions).mockResolvedValueOnce(mockResult);
    await expect(generateRegistrationOptions(mockOpts)).resolves.toSucceedWith(mockResult);
  });

  test('returns Failure capturing upstream error message on throw', async () => {
    jest.mocked(upstream.generateRegistrationOptions).mockRejectedValueOnce(
      new Error('Challenge is not in the correct format')
    );
    await expect(generateRegistrationOptions(mockOpts)).resolves.toFailWith(
      /challenge is not in the correct format/i
    );
  });
});
```

Use `@fgv/ts-utils-jest` matchers per `.ai/instructions/TESTING_GUIDELINES.md`. 100% coverage in both packages.

**Checkpoint:** `rushx test` passes with 100% coverage in both packages.

### B.5 — Documentation

Update `.ai/instructions/LIBRARY_CAPABILITIES.md` per design §7. Add a new section (after `@fgv/ts-web-extras`) titled something like:

> ### `@fgv/ts-extras-webauthn` + `@fgv/ts-web-extras-webauthn` — WebAuthn Result boundary

Include the six-primitive table and the explicit "NOT in scope" list from D2. Make the boundary-only positioning unmissable for future readers — the design's framing is exactly right.

Add decision shortcuts:

- **"Need a Result-integrated WebAuthn registration / authentication primitive (server-side)?"** → `generateRegistrationOptions` / `verifyRegistrationResponse` / `generateAuthenticationOptions` / `verifyAuthenticationResponse` from `@fgv/ts-extras-webauthn`. Wraps `@simplewebauthn/server`. Caller still owns ceremony orchestration, challenge management, and credential storage.
- **"Need to start a WebAuthn ceremony in the browser?"** → `startRegistration` / `startAuthentication` from `@fgv/ts-web-extras-webauthn`. Wraps `@simplewebauthn/browser`.
- **Note:** these packages do NOT include PRF helpers, challenge generators, attestation policy, or credential storage. For anything beyond the Result boundary, call `@simplewebauthn/*` directly.

Update the package table at the top of the doc to add the two new packages.

Regenerate api-extractor for both new packages.

**Checkpoint:** docs reflect implementation; api-extractor regenerated.

### B.6 — Pre-merge artifact migration

Migrate `.ai/tasks/active/crypto-batch-2-webauthn/` → `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/`. Write a **separate polished `README.md`** capturing:

- What shipped (two packages, six primitives)
- The Result-integration-boundary discipline (D1, D2) — the README is the durable record of what fgv did NOT include and why
- Key decisions (libraries/ placement, v13+ only, `Parameters<>` aliases, jest.mock upstream)
- Acceptance status
- Followups: TECH_DEBT / FUTURE candidates (e.g. the `integrations/` convention question from OQ-1)

Pre-merge migration is mandatory per `.ai/conventions/workflow/artifact-protocol.md`. **Separate polished README.md** — not just the migrated state.md.

Note: a phase A draft PR (#342) exists on the WebAuthn agent branch. That PR is being superseded by this consolidated cluster work; the orchestrator will close it when the prep PR merges. Implementer does not need to touch #342.

---

## Package surface

### In-scope (create / modify)

- `libraries/ts-extras-webauthn/` — new package (full structure per design §2)
- `libraries/ts-web-extras-webauthn/` — new package (full structure per design §2)
- `rush.json` — register both new packages
- `common/config/rush/common-versions.json` — add `@simplewebauthn/server` and `@simplewebauthn/browser` to `preferredVersions`
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — new section + decision shortcuts + package table update
- `.ai/tasks/active/crypto-batch-2-webauthn/state.md` — checkpoint updates
- Pre-merge: migrate `.ai/tasks/active/crypto-batch-2-webauthn/` → `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/` with polished `README.md`

### Out-of-scope

- Any abstraction beyond the six primitives (D2 — the rejected-temptations list is binding)
- Modifications to `@fgv/ts-extras`, `@fgv/ts-web-extras`, `@fgv/ts-utils`, or any other existing package (zero impact; design §10)
- HPKE, Argon2id surfaces (parallel streams)
- Sudoku packages

### Parallel-stream awareness

Both HPKE and Argon2id phase B will also touch `.ai/instructions/LIBRARY_CAPABILITIES.md`. The HPKE stream updates the `crypto-utils` packlet entry plus adds one decision shortcut. The Argon2id stream adds new packages to the table, new decision shortcuts, and updates the `crypto-utils` packlet entry. WebAuthn adds a new top-level section + two decision shortcuts + two table entries. Section-level discipline (each stream owns its added section / decision-shortcut / table-row) keeps merge conflicts minimal. If a real conflict arises, coordinate via state.md checkpoints.

---

## Required reading (priority order)

1. `.ai/tasks/active/crypto-batch-2-webauthn/brief-phase-b.md` (this file) — binding contract
2. `.ai/tasks/active/crypto-batch-2-webauthn/design.md` — phase A inventory + six-primitive surface
3. `.ai/tasks/active/crypto-batch-2-webauthn/brief.md` — phase A contract
4. `.ai/notes/cross-repo-handoffs/fgv-batch-2-handoff-2026-05.md` — consumer context
5. `libraries/ts-utils-jest/` — small-package structural precedent (package.json / tsconfig / rig / jest config)
6. `libraries/ts-web-extras/` — browser-package precedent (jsdom test environment, package.json shape)
7. `libraries/ts-utils/src/packlets/base/result.ts` — `captureAsyncResult` reference (don't re-implement)
8. `@simplewebauthn/server` v13 docs — https://simplewebauthn.dev/docs/packages/server
9. `@simplewebauthn/browser` v13 docs — https://simplewebauthn.dev/docs/packages/browser
10. `.ai/instructions/CODING_STANDARDS.md` § Pre-PR Validation Checklist — lint discipline
11. `.ai/instructions/TESTING_GUIDELINES.md` — Result matchers, 100% coverage
12. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — free hand on breaking changes; no compat shims for new packages

---

## Skills to load (when conditions trigger)

- `/result-pattern` — load before writing the wrappers (every function returns `Promise<Result<T>>`)
- `/result-tests` — load before writing tests; use Result matchers
- `/published-primitives-reflex` — load if tempted to write any helper beyond the six primitives (this is the kill-switch on abstraction creep)

---

## Acceptance criteria

- [ ] Both new packages registered in `rush.json` and installable via `rush update`
- [ ] All six primitives implemented as one-line `captureAsyncResult` wrappers
- [ ] Type re-exports limited to the direct-signature types (D4); `Parameters<>` aliases used for upstream-unnamed opts types
- [ ] No abstractions beyond the six primitives (no challenge gen / PRF helper / autofill validator / credential builder — D2)
- [ ] `jest.mock` used for upstream in all tests (no real WebAuthn ceremony)
- [ ] `rushx build` passes in both new packages
- [ ] **`rushx lint` passes in both new packages** (load-bearing — NOT transitively run by build; see CODING_STANDARDS § Pre-PR Validation Checklist)
- [ ] `rushx test` passes with 100% coverage in both new packages
- [ ] **`rushx fixlint` was run before the final commit**
- [ ] No `any` types; all fallible operations return `Result<T>`
- [ ] No inline lint-rule-disable directives added to make lint pass
- [ ] api-extractor generated for both new packages
- [ ] `LIBRARY_CAPABILITIES.md` updated with new section, decision shortcuts, and package table rows
- [ ] `common/config/rush/common-versions.json` `preferredVersions` entries added
- [ ] Pre-merge artifact migration to `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/` with **separate polished README.md** that captures the boundary-only discipline
- [ ] PR opened against `claude/crypto-batch-2-features` (NOT `release`)

---

## Branch + PR posture

- **Base branch:** `claude/crypto-batch-2-features` (cluster integration)
- **Work branch:** `claude/crypto-batch-2-webauthn-impl` (or harness-auto-suffix; document the actual branch in state.md)
- **PR target:** `claude/crypto-batch-2-features`
- One PR for all of B.1–B.6 unless something forces a split.
- Note: PR #342 (the WebAuthn phase A draft) is being superseded by this work. Orchestrator will close it after the prep PR merges.

---

## Don't

- Don't open the PR until `rushx build && rushx lint && rushx test` all pass locally. `rushx build` does NOT transitively run lint; lint is a separate gate. Run `rushx fixlint` before the final commit.
- Don't add ANY of the rejected abstractions from D2 / OQ-4. If you find yourself drafting one, STOP and surface to the orchestrator. The Result-integration boundary IS the product.
- Don't add an error-message prefix in the wrappers — `captureAsyncResult` captures the upstream message bare (D5).
- Don't take `@simplewebauthn/types` as a dependency — v13+ exports types from server/browser packages directly (D3).
- Don't use the real `@simplewebauthn/*` in tests — `jest.mock` upstream entirely (D6).
- Don't add packlets — flat single-file `src/index.ts` per package (D8).
- Don't re-export types beyond the direct-signature set (D4). Deeper types stay caller-imported.

---

## Resume protocol

If the session ends mid-phase: read `brief-phase-b.md` (this file), `design.md`, and `state.md` to resume. State.md records which checkpoints (B.1–B.6) are done.

---

## Missing-input rule

If a required-reading file is missing or has a shape that conflicts with this brief, or if upstream `@simplewebauthn/*` v13.x has changed signatures since the design (verify `@simplewebauthn/server`'s currently-published v13.x exports if anything looks off), **STOP and report**. Do not improvise.
