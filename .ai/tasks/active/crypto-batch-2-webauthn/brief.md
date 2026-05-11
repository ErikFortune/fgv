# Stream Brief: crypto-batch-2-webauthn (phase A — research and design)

**Stream ID:** crypto-batch-2-webauthn
**Cluster:** crypto-batch-2 (integration branch `claude/crypto-batch-2-features`)
**Phase:** A — research and design (no production code)
**Sequencing:** Phase A runs in parallel with the other crypto-batch-2 streams. Phase B sequencing decided post-signoff.

---

## Context

Personaility's Phase 2 uses WebAuthn-PRF as the default daily unlock credential under η-v2 §3. At enrollment, the user touches an authenticator and the credential id + PRF salt land in personaility's credential table. At each unlock, the client invokes WebAuthn with PRF extension, gets back a deterministic 32-byte PRF output, derives the keystore master from it, HPKE-wraps to the home hub, and ships it server-side for session-establish.

The full personaility-side context is at `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md`.

### Decisions already made (orchestrator + user, 2026-05-11)

This stream's whole shape is determined by a deliberate decision: **fgv does NOT wrap WebAuthn opinionatedly**. After Q3 debate, the resolution was:

- **D1 — Result-integration boundary only.** fgv wraps `@simplewebauthn/server` and `@simplewebauthn/browser` strictly to convert their throw-on-failure interface into `Result<T>`. No opinion is baked in: attestation policy, extension selection, algorithm allowlist, challenge state management — all flow through as caller-supplied arguments from the upstream library's typed inputs.
- **D2 — Separate packages.** Same structural pattern as Argon2id:
  - `@fgv/ts-extras-webauthn` — wraps `@simplewebauthn/server`
  - `@fgv/ts-web-extras-webauthn` — wraps `@simplewebauthn/browser`
  Non-WebAuthn consumers don't pay the dependency cost.
- **D3 — Narrow primitive surface only.** Six functions total. Server: `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`. Browser: `startRegistration`, `startAuthentication`. No higher-level abstraction (no session manager, no credential-table helpers, no attestation-policy presets, no extension helpers). Consumers build their own opinionated wrappers on top of these primitives.
- **D4 — General pattern parked.** The "Result-integration boundary over a well-maintained upstream library" shape (analogous to `@fgv/ts-utils-jest`'s relationship to Jest) is a fgv convention worth codifying after the cluster lands. This stream is one instance; future cross-cutting lessons triage will decide whether to write it up as a convention.

The strict scoping is the load-bearing discipline. **If phase A surfaces design proposals that pull additional surface inside (attestation verification helpers; challenge stores; ceremony orchestrators), reject those proposals.** The principle: fgv owns the Result-shaped boundary; consumers own the opinions.

---

## Mission

Produce a design document at `.ai/tasks/active/crypto-batch-2-webauthn/design.md` covering the package structure, the exact function signatures for the six primitive operations (matching upstream input/output types as closely as possible with Result-integration added), the error context format, and the version-pin strategy.

**Do not modify production code in this phase.** Read freely; write only `design.md` and `state.md`.

---

## Phase A deliverable: `design.md`

Required sections, in order:

### 1. Upstream library survey

For `@simplewebauthn/server` and `@simplewebauthn/browser`:
- Current major version, recent release cadence
- Stability of the six primitive operations across recent major versions
- Any documented breaking-change patterns
- License compatibility with fgv's MIT
- Bundle-size implications for the browser package

Confirm both libraries are the right wrap target. (They are widely-used and actively maintained; this is mostly a record-of-confirmation step.)

### 2. Package structure

Specify both packages:
- `@fgv/ts-extras-webauthn` — exports the four server-side primitives; depends on `@simplewebauthn/server`
- `@fgv/ts-web-extras-webauthn` — exports the two browser-side primitives; depends on `@simplewebauthn/browser`

Rush.json + monorepo wiring concerns. Note any naming or scoping issues that affect consumers' imports.

### 3. Exact function signatures

For each of the six primitives, propose the exact exported function signature. Each follows the same shape:
- Type-pass-through input: the upstream library's input type, exported as-is (re-exported from the wrap if useful)
- Promise-Result return: `Promise<Result<UpstreamReturnType>>`
- Result-context: `Result.fail` messages preserve the upstream error's information without losing detail

Example (illustrative, refine in design):

```typescript
// @fgv/ts-extras-webauthn (server-side)

import {
  generateRegistrationOptions as upstreamGenerateRegistrationOptions,
  type GenerateRegistrationOptionsOpts,
  type PublicKeyCredentialCreationOptionsJSON,
  // ... etc
} from '@simplewebauthn/server';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

export type {
  GenerateRegistrationOptionsOpts,
  PublicKeyCredentialCreationOptionsJSON,
  // ... full re-export of types used in the wrapped surface
};

export async function generateRegistrationOptions(
  opts: GenerateRegistrationOptionsOpts
): Promise<Result<PublicKeyCredentialCreationOptionsJSON>> {
  return captureAsyncResult(() => upstreamGenerateRegistrationOptions(opts));
}
```

Specify the same for the other five primitives. Use upstream type names verbatim — that preserves the "pass-through" semantics and minimizes our maintenance burden.

### 4. Error context format

Upstream library can throw with various error types and messages. Propose how Result.fail messages capture the thrown value:
- Preserve original message? (Probably yes — caller may match against it)
- Wrap with fgv-specific prefix? (e.g. "webauthn.generateRegistrationOptions: <upstream message>")
- Preserve the error class? (`Result<T>` is value-shaped; class info is harder to preserve — but error context can include the original class name in the message)

Pattern check: what does fgv's `captureAsyncResult` already do? Whatever it preserves is the baseline. If we need more, this design should propose the extension; otherwise we use defaults.

### 5. Type re-export discipline

The wrap's whole value-add is Result-integration. But callers need access to upstream types (input shapes, response shapes, intermediate option types, enums for attestation conveyance preferences, etc.). Propose:
- Full re-export of the upstream types our primitives accept/return?
- Selective re-export of only the types appearing in our six signatures?
- No re-exports; consumers import upstream types directly?

Recommendation lean: full re-export of types appearing in our function signatures (input + output, transitively). Anything else, consumers import directly from `@simplewebauthn/server` (or `/browser`). This keeps fgv's API surface narrow without forcing two-import-statement-per-call ergonomics.

### 6. Version-pin strategy

WebAuthn spec evolves; `@simplewebauthn/*` ships updates. Propose:
- Pin upstream version in the new packages' `package.json` — exact, caret, or tilde?
- Rush preferredVersions discipline
- Cadence for re-checking upstream version (quarterly? on-major? security-advisory-only?)
- Migration shape when upstream ships a breaking change in one of our wrapped functions' signatures (re-export-and-bump? add-method-deprecate-old?)

### 7. Documentation and consumer guidance

`LIBRARY_CAPABILITIES.md` will get a new section after phase B. Phase A should sketch what that section says — specifically what consumers should know:
- This is a Result-integration boundary, not an opinionated WebAuthn helper
- Six primitive operations; for anything else, use `@simplewebauthn/*` directly (with try/catch)
- Specifically NOT in scope: attestation policy, challenge state, extension helpers, ceremony orchestration
- The recommended pattern: build a consumer-specific opinionated wrapper that consumes these primitives + adds the consumer's choices

### 8. PRF extension — flag if anything special needed

Personaility specifically uses the PRF extension. PRF is a WebAuthn extension supported by `@simplewebauthn` through the standard input/output types — there's likely nothing PRF-specific the boundary wrapper needs to do (PRF lives in the caller-supplied input options and the response data). Confirm this in the design; if there's anything special (e.g., a separate `@simplewebauthn/server/prf` import path), document it.

### 9. Implementation plan

Outline phase B implementation breakdown:
- New packages: rush register, package.json shape, tsconfig, jest config
- Per-file implementation order
- Test coverage strategy: each primitive needs at least one success-case test (mock upstream lib? use real upstream lib?) and one failure-case test (validate Result.fail capture works)
- LIBRARY_CAPABILITIES.md addition

Not the phase B brief; just enough that the orchestrator can write the brief from this.

### 10. Migration impact

The new packages are net-additions. Existing consumers see no change. Document the confirmed-zero migration impact for the record.

### 11. Open questions for signoff

Anything the design surfaces that needs orchestrator/user input before phase B.

---

## Package surface (read-only for phase A)

Phase A reads but does not modify:
- `libraries/ts-utils-jest/` — REFERENCE for the "Result-integration boundary over an external library" pattern. The Jest matchers are the precedent for what we're doing with WebAuthn. Read the package structure, the API shape, the test approach.
- `libraries/ts-extras/src/packlets/crypto-utils/` — to understand the existing crypto-utils style (we're NOT modifying it; this stream's output lives in new packages)
- `rush.json` and `common/config/rush/` — package-registration pattern
- `.ai/instructions/LIBRARY_CAPABILITIES.md` § ts-utils-jest — the existing precedent for an "integration package"
- `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md`

Phase A writes only:
- `.ai/tasks/active/crypto-batch-2-webauthn/design.md` (new)
- `.ai/tasks/active/crypto-batch-2-webauthn/state.md` (update at checkpoints)

Phase B (separately commissioned) will create the new packages, write the wrapper code, write tests, update `LIBRARY_CAPABILITIES.md`.

---

## Required reading (priority order)

1. `.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md` — consumer context
2. `libraries/ts-utils-jest/` — full package as the precedent for "Result-integration boundary over an external library"
3. `@simplewebauthn/server` documentation — current API for the four server-side primitives
4. `@simplewebauthn/browser` documentation — current API for the two browser-side primitives
5. `rush.json` and `common/config/rush/` — package-registration pattern
6. `docs/WORKSTREAMS.md` preamble — repo shape, lockstep policy
7. `.ai/instructions/MONOREPO_GUIDE.md` — Rush conventions
8. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `crypto-utils` is on the active list (the new packages are new code; "no compat burden" applies)
9. `.ai/instructions/LIBRARY_CAPABILITIES.md` — existing external-framing conventions, especially the ts-utils-jest section

---

## Skills to load (when conditions trigger)

- `/published-primitives-reflex` — before recommending any utility helper. The whole point of this stream is to NOT add abstraction; check this skill before introducing anything that smells like one.
- `/result-pattern` — load. Every function in this stream returns `Result<T>`.
- `/type-safe-validation` — load if input-validation surfaces (probably doesn't — input types come from upstream, validation is the upstream library's responsibility).

---

## Web access

You may web-search and web-fetch:
- `@simplewebauthn/server` and `@simplewebauthn/browser` documentation
- Their GitHub repos for current API + recent release notes
- The WebAuthn Level 2 / Level 3 specs for context on what PRF extension is
- Bundle size data for `@simplewebauthn/browser`

Cite URLs.

---

## Missing-input rule

If a required-reading file is missing, has a shape that conflicts with this brief, or if research surfaces a structural issue (e.g. `@simplewebauthn` has restructured its primitive surface since this brief was written), **STOP and report**. Do not improvise.

**Specifically — if you find yourself wanting to design a session manager, challenge store, attestation policy preset, extension helper, or any other abstraction layer above the six primitives — STOP.** That's exactly what D3 forbids. Surface the temptation as an open question; let the orchestrator decide.

---

## Phase A acceptance criteria

- [ ] `design.md` exists at the specified path with all eleven sections populated
- [ ] All six primitive signatures specified concretely (input type, return type, error capture)
- [ ] Package structure clear; Rush wiring concerns addressed
- [ ] Type re-export discipline decided
- [ ] Version-pin strategy proposed
- [ ] PRF extension handling confirmed (likely no special handling needed)
- [ ] Implementation plan detailed enough for orchestrator to write phase B brief
- [ ] No abstraction creep — the design proposes exactly six functions

---

## Phase A exit artifact (state.md)

At completion, `state.md` should record:
- Phase A done; Phase B awaiting signoff
- `design.md` path
- Recommendation summary (one paragraph)
- Any research findings on `@simplewebauthn` stability, version-pin patterns, etc.
- Anything decided to exclude (especially: temptations to add abstraction beyond the six primitives — surface these explicitly so the orchestrator can confirm the no-creep discipline held)

---

## Branch + PR posture

- **Base branch:** `claude/crypto-batch-2-features`
- **Work branch:** `claude/crypto-batch-2-webauthn-design` (or harness-auto-suffix; document actual name in state.md)
- **PR target:** `claude/crypto-batch-2-features`
- Single PR containing `design.md` + updated `state.md`. No production code.

---

## Resume protocol

If the session ends mid-phase: read `brief.md` (this file) and `state.md` to resume.

---

## Out of scope (both phases) — strictly enforced

- Attestation verification helpers (caller passes upstream attestation policy options; we don't add a layer)
- Challenge state management / challenge stores (caller manages; we don't abstract)
- Extension helpers (PRF, LargeBlob, etc. flow through upstream input/output types; we don't add helpers)
- Algorithm allowlist policy (caller specifies via upstream input options; we don't pre-pick)
- Higher-level ceremony orchestration (registration flow with verification + storage; authentication flow with assertion + verification; etc.)
- Credential table / user database abstractions
- Session token issuance
- Anything that's not one of the six pass-through primitive operations
- HPKE, Argon2id, sign/verify, timingSafeEqual — parallel streams
- Sudoku packages

If a consumer needs any of the above, **they build it on top of this stream's primitives.** That's the load-bearing discipline.
