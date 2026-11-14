# Stream Completion: crypto-batch-2-webauthn

**Stream ID:** crypto-batch-2-webauthn  
**Completed:** 2026-05-12  
**Phases:** A (research and design) + B (implementation)  
**Branch:** `claude/crypto-batch-2-webauthn-impl-6XN80`  
**PR target:** `claude/crypto-batch-2-features`

---

## What shipped

Two new monorepo packages providing a **Result-integration boundary** over `@simplewebauthn/server` (Node) and `@simplewebauthn/browser` (browser). Six primitive functions total.

### `@fgv/ts-extras-webauthn` — server-side boundary
`libraries/ts-extras-webauthn/`

| Function | Return type |
|---|---|
| `generateRegistrationOptions(opts)` | `Promise<Result<PublicKeyCredentialCreationOptionsJSON>>` |
| `verifyRegistrationResponse(opts)` | `Promise<Result<VerifiedRegistrationResponse>>` |
| `generateAuthenticationOptions(opts)` | `Promise<Result<PublicKeyCredentialRequestOptionsJSON>>` |
| `verifyAuthenticationResponse(opts)` | `Promise<Result<VerifiedAuthenticationResponse>>` |

### `@fgv/ts-web-extras-webauthn` — browser-side boundary
`libraries/ts-web-extras-webauthn/`

| Function | Return type |
|---|---|
| `startRegistration(opts)` | `Promise<Result<RegistrationResponseJSON>>` |
| `startAuthentication(opts)` | `Promise<Result<AuthenticationResponseJSON>>` |

---

## The Result-integration-boundary discipline (D1, D2)

The guiding principle of this stream: **the boundary is the whole product**.

Each function is a one-line `captureAsyncResult(() => upstream(options))`. No transformation of inputs, no rewrapping of outputs, no error-message prefix, no ceremony orchestration.

### What was explicitly NOT included (and why)

These abstractions were considered during phase A research and explicitly rejected:

| Temptation | Rejection reason |
|---|---|
| Challenge generator helper | `generateRegistrationOptions` and `generateAuthenticationOptions` can generate challenges automatically — nothing to add at the boundary |
| PRF salt helper (string/Buffer → Uint8Array) | PRF extension is caller's concern; it flows through the standard `extensions` field unchanged |
| `browserAutofillInput` validator / `autocomplete` attribute helper | Autofill is caller-side UI concern |
| `WebAuthnCredential` builder from registration output | Credential storage is the caller's responsibility |
| Attestation policy presets | Caller owns policy |
| Algorithm allowlist presets | Caller owns crypto policy |
| Challenge state management / challenge stores | Caller owns state |
| Session token issuance | Caller owns sessions |
| Ceremony orchestration helpers | Caller owns orchestration |
| Credential / user database abstractions | Caller owns data layer |

The test for whether something belongs here: does it touch the Result-integration boundary? If not, it belongs in the caller's opinionated wrapper.

---

## Key design decisions

### D1 — Six primitives, nothing else
Each is a one-liner. The simplicity is intentional and load-bearing.

### D2 — No prefix in error messages
`captureAsyncResult` captures the upstream error message bare. Upstream error messages from `@simplewebauthn/*` are self-describing. Consumers wanting prefix context add it via `.withErrorFormat()` at their layer.

### D3 — Version pin: `^13.0.0`
Both packages target `@simplewebauthn/*` v13+ only. v13 inlined the `@simplewebauthn/types` package — no separate types dependency needed. Caret allows patch/minor auto-update within the major.

### D4 — Type re-exports: direct-signature types only
Re-exported types are limited to those appearing directly in function input/output signatures. Deeper types (`AuthenticatorTransportFuture`, `COSEAlgorithmIdentifier`, etc.) remain caller-imported from `@simplewebauthn/*` directly.

v13 exports `VerifyRegistrationResponseOpts` and `VerifyAuthenticationResponseOpts` as named aliases (using `Parameters<typeof fn>[0]` upstream). We import and re-export them directly — no need for our own aliases.

### D5 — Flat structure, no packlets
Each package is a single `src/index.ts`. Single-purpose boundaries don't need internal organization.

### D6 — `jest.mock` upstream entirely
Tests use `jest.mock('@simplewebauthn/server')` / `jest.mock('@simplewebauthn/browser')` at the top of each test file. The thing being tested is the `captureAsyncResult` integration, not WebAuthn ceremony correctness.

### D7 — `libraries/` placement (not `integrations/`)
Both packages live in `libraries/` per OQ-1 resolution. The `integrations/` convention question is a separate lessons-codification chore.

---

## Acceptance status

- [x] Both packages registered in `rush.json`
- [x] All six primitives implemented as one-line `captureAsyncResult` wrappers
- [x] Type re-exports limited to direct-signature types
- [x] No abstractions beyond the six primitives
- [x] `jest.mock` used for upstream in all tests (no real WebAuthn ceremony)
- [x] `rushx build` passes in both packages
- [x] `rushx lint` passes in both packages
- [x] `rushx test` passes with 100% coverage in both packages (8 tests server, 4 tests browser)
- [x] `rushx fixlint` run before final commit
- [x] No `any` types; all fallible operations return `Result<T>`
- [x] No inline lint-rule-disable directives
- [x] api-extractor generated for both packages
- [x] `LIBRARY_CAPABILITIES.md` updated with new section, decision shortcuts, and package entries
- [x] `common/config/rush/common-versions.json` `preferredVersions` entries added
- [x] Artifact migration complete with polished README.md

---

## Lessons learned

### L1 — `"sideEffects": false` is a required field for pure library packages

Every pure library in this monorepo carries `"sideEffects": false` in its `package.json` so bundlers can tree-shake it. This was caught in PR review on this stream (`ts-extras-webauthn` was missing it; `ts-web-extras-webauthn` had it). 

**For future streams:** any new `libraries/` package whose `src/index.ts` exports only functions and types (no module-level side effects) must include `"sideEffects": false` before opening a PR. Add it alongside `"main"` and `"types"` as part of the standard package scaffold.

---

## Followups (FUTURE / TECH_DEBT candidates)

- **`integrations/` convention question (OQ-1):** whether the "Result-integration boundary over a well-maintained upstream library" pattern deserves its own top-level directory. Lessons-codification chore; does not block this stream.
- **`@simplewebauthn/*` v14 migration:** when upstream ships v14, review changelog for signature changes. The type re-exports are straightforward to update; no `Parameters<>` aliases of our own to maintain (since upstream now exports the opts types directly).
- **Security advisory monitoring:** any CVE affecting `@simplewebauthn/*` should trigger an immediate patch + version bump in both packages.
