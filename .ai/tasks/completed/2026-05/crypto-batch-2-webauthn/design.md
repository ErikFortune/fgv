# Design: crypto-batch-2-webauthn

**Stream:** crypto-batch-2-webauthn  
**Phase:** A — research and design  
**Author:** implementing agent  
**Date:** 2026-05-12  
**Status:** draft — awaiting orchestrator signoff

---

## 1. Upstream library survey

### @simplewebauthn/server

- **Current version:** 13.3.0 (released 2026-03-10)
- **Source:** https://github.com/MasterKale/SimpleWebAuthn
- **npm:** https://www.npmjs.com/package/@simplewebauthn/server
- **License:** MIT — compatible with fgv's MIT

**Release cadence:** active and well-maintained. Major version history shows consistent cadence (v4 → v5 → v6 → v7 → v8 → v9 → v10 → v11 → v12 → v13), roughly one to two major versions per year since 2020. Current series (v11–v13) has been stable in surface area; v13.x is primarily refinement.

**Stability of the four server-side primitives across recent majors:**

| Function | Last significant signature change |
|---|---|
| `generateRegistrationOptions` | v10 (Base64URLString for excluded credential IDs; random user ID default) |
| `verifyRegistrationResponse` | v11 (return type restructured: `credential` object replaces individual properties) |
| `generateAuthenticationOptions` | v10 (`rpID` became required; Base64URLString for allowed credential IDs) |
| `verifyAuthenticationResponse` | v11 (argument renamed `authenticator` → `credential`; return type gained `authenticationInfo`) |

Since v11, the surface has been stable. v12 added JSR registry support (no API change). v13 added registration hints support and improved attestation trust anchor verification — refinements, not breaks. The v11 → v12 → v13 path has had no signature-level breaking changes to our four primitives.

**Documented breaking-change patterns:**
- Major versions reliably include breaking changes
- The changelog at https://github.com/MasterKale/SimpleWebAuthn/blob/master/CHANGELOG.md is comprehensive and explicitly marks breaking changes with `**Breaking**`
- The pattern since v7 is: functions are async (`Promise<T>` returns); inputs use `Base64URLString` not `Uint8Array`; output types are structured objects

**Notable v13 change:** Types no longer require the separate `@simplewebauthn/types` package — all types are exported directly from `@simplewebauthn/server` and `@simplewebauthn/browser`. This simplifies our wrapper significantly (no three-way dependency).

**Verdict:** Confirmed correct wrap target. Widely used, TypeScript-first, actively maintained, MIT-licensed, stable API in current major.

---

### @simplewebauthn/browser

- **Current version:** 13.3.0 (same versioning as server package — they are released in lockstep)
- **npm:** https://www.npmjs.com/package/@simplewebauthn/browser
- **License:** MIT — compatible with fgv's MIT

**Release cadence:** same lockstep cadence as server package.

**Stability of the two browser-side primitives:**

| Function | Last significant signature change |
|---|---|
| `startRegistration` | v11 (object argument shape: `{ optionsJSON, useAutoRegister? }`) |
| `startAuthentication` | v11 (object argument shape: `{ optionsJSON, useBrowserAutofill?, verifyBrowserAutofillInput? }`) |

Stable since v11. No changes in v12 or v13.

**Bundle-size implications:**  
`@simplewebauthn/browser` is approximately **9.1 KB gzipped** (current v13.x). This is low overhead for a WebAuthn integration library — the entire implementation including crypto helpers is under 10 KB compressed. The library ships two bundles: an ES2021 bundle for modern browsers and an ES5 bundle with polyfills for older targets. The ES5 bundle is larger due to polyfills; consumers targeting modern browsers (which is the correct baseline for WebAuthn) should use the ES2021 build. Our `@fgv/ts-web-extras-webauthn` wrapper adds no material overhead beyond the upstream dependency.

Source: https://simplewebauthn.dev/docs/packages/browser; https://www.npmjs.com/package/@simplewebauthn/browser

**Verdict:** Confirmed correct wrap target. ~9 KB gzipped is acceptable for a browser authentication library. Stable API in current major.

---

## 2. Package structure

### Two new packages

#### `@fgv/ts-extras-webauthn`

```
libraries/ts-extras-webauthn/
├── src/
│   ├── index.ts                  # re-exports; four server-side primitives + types
│   └── test/
│       └── unit/
│           └── webauthn.test.ts  # tests for all four server primitives
├── package.json
├── tsconfig.json
├── config/
│   ├── rig.json
│   ├── jest.config.json
│   └── api-extractor.json
└── CHANGELOG.json
```

**Dependencies:**
- `dependencies`: `@simplewebauthn/server`, `@fgv/ts-utils`
- `devDependencies`: standard heft/jest/ts toolchain (mirrors ts-extras or ts-utils-jest pattern)
- `peerDependencies`: `@fgv/ts-utils`

**rush.json entry:**
```json
{
  "packageName": "@fgv/ts-extras-webauthn",
  "projectFolder": "libraries/ts-extras-webauthn",
  "shouldPublish": true,
  "versionPolicyName": "base-utils",
  "tags": ["libraries"]
}
```

**Runtime environment:** Node (server-side). Standard `@fgv/heft-dual-rig` rig, same as ts-extras.

---

#### `@fgv/ts-web-extras-webauthn`

```
libraries/ts-web-extras-webauthn/
├── src/
│   ├── index.ts                  # re-exports; two browser-side primitives + types
│   └── test/
│       └── unit/
│           └── webauthn.test.ts  # tests for both browser primitives
├── package.json
├── tsconfig.json
├── config/
│   ├── rig.json
│   ├── jest.config.json
│   └── api-extractor.json
└── CHANGELOG.json
```

**Dependencies:**
- `dependencies`: `@simplewebauthn/browser`, `@fgv/ts-utils`
- `devDependencies`: standard heft/jest/ts toolchain; jsdom test environment (same as ts-web-extras)
- `peerDependencies`: `@fgv/ts-utils`

**rush.json entry:**
```json
{
  "packageName": "@fgv/ts-web-extras-webauthn",
  "projectFolder": "libraries/ts-web-extras-webauthn",
  "shouldPublish": true,
  "versionPolicyName": "base-utils",
  "tags": ["libraries", "browser"]
}
```

**Runtime environment:** browser. Jest configuration uses `testEnvironment: "jsdom"` — same pattern as `ts-web-extras`. The `@simplewebauthn/browser` functions call `navigator.credentials.*`; tests mock the upstream module entirely (see §9), so jsdom's incomplete `navigator.credentials` implementation is not a problem in practice.

---

### Naming and scoping

`@fgv/ts-extras-webauthn` follows the same naming pattern as the Argon2 stream's `@fgv/ts-extras-argon2`: a `ts-extras-*` suffix for Node libraries and `ts-web-extras-*` for browser libraries that are separate packages because of a heavyweight upstream dependency. The naming convention is clear and consistent.

**Import ergonomics for consumers:**
```typescript
// Server-side (Node)
import { generateRegistrationOptions, verifyRegistrationResponse } from '@fgv/ts-extras-webauthn';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@fgv/ts-extras-webauthn';

// Browser-side
import { startRegistration, startAuthentication } from '@fgv/ts-web-extras-webauthn';
```

Clean, predictable, no scoping issues.

---

## 3. Exact function signatures

All six primitives follow this shape:
1. Accept upstream's input type unchanged
2. Return `Promise<Result<UpstreamReturnType>>`
3. Implemented as `captureAsyncResult(() => upstream(options))`

### Server package (`@fgv/ts-extras-webauthn`)

```typescript
import {
  generateRegistrationOptions as _generateRegistrationOptions,
  verifyRegistrationResponse as _verifyRegistrationResponse,
  generateAuthenticationOptions as _generateAuthenticationOptions,
  verifyAuthenticationResponse as _verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

// ---- Type re-exports (see §5 for full discipline) ----
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

// Type aliases for verify functions — upstream does not export named opts types for these.
// Using Parameters<> keeps these aliases automatically in sync with the upstream signature.
export type VerifyRegistrationResponseOpts = Parameters<typeof _verifyRegistrationResponse>[0];
export type VerifyAuthenticationResponseOpts = Parameters<typeof _verifyAuthenticationResponse>[0];

// ---- The four server-side primitives ----

export async function generateRegistrationOptions(
  options: GenerateRegistrationOptionsOpts
): Promise<Result<PublicKeyCredentialCreationOptionsJSON>> {
  return captureAsyncResult(() => _generateRegistrationOptions(options));
}

export async function verifyRegistrationResponse(
  options: VerifyRegistrationResponseOpts
): Promise<Result<VerifiedRegistrationResponse>> {
  return captureAsyncResult(() => _verifyRegistrationResponse(options));
}

export async function generateAuthenticationOptions(
  options: GenerateAuthenticationOptionsOpts
): Promise<Result<PublicKeyCredentialRequestOptionsJSON>> {
  return captureAsyncResult(() => _generateAuthenticationOptions(options));
}

export async function verifyAuthenticationResponse(
  options: VerifyAuthenticationResponseOpts
): Promise<Result<VerifiedAuthenticationResponse>> {
  return captureAsyncResult(() => _verifyAuthenticationResponse(options));
}
```

**Key type notes:**
- `GenerateRegistrationOptionsOpts` and `GenerateAuthenticationOptionsOpts` are exported by `@simplewebauthn/server` as named type aliases (using the `Parameters<typeof fn>[0]` idiom upstream)
- `VerifyRegistrationResponseOpts` and `VerifyAuthenticationResponseOpts` are NOT exported by upstream — we define them as `Parameters<>` aliases; this guarantees they stay in sync with upstream automatically
- `RegistrationResponseJSON` and `AuthenticationResponseJSON` appear as the `response` field in the verify opts types; re-exporting them allows consumers to import the full JSON response shape from our package
- `WebAuthnCredential` is re-exported because it appears as the `credential` field in `VerifyAuthenticationResponseOpts` (callers need this type to shape the credential they pass in from their database)

---

### Browser package (`@fgv/ts-web-extras-webauthn`)

```typescript
import {
  startRegistration as _startRegistration,
  startAuthentication as _startAuthentication,
} from '@simplewebauthn/browser';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

// ---- Type re-exports (see §5 for full discipline) ----
export type {
  StartRegistrationOpts,
  RegistrationResponseJSON,
  StartAuthenticationOpts,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';

// ---- The two browser-side primitives ----

export async function startRegistration(
  options: StartRegistrationOpts
): Promise<Result<RegistrationResponseJSON>> {
  return captureAsyncResult(() => _startRegistration(options));
}

export async function startAuthentication(
  options: StartAuthenticationOpts
): Promise<Result<AuthenticationResponseJSON>> {
  return captureAsyncResult(() => _startAuthentication(options));
}
```

**Key type notes:**
- `StartRegistrationOpts` and `StartAuthenticationOpts` are exported by `@simplewebauthn/browser` (defined as `Parameters<typeof fn>[0]` upstream)
- `RegistrationResponseJSON` and `AuthenticationResponseJSON` are the concrete return types — consumers need them when pattern-matching on the result

---

### Shared type overlap note

`RegistrationResponseJSON` and `AuthenticationResponseJSON` appear in both packages (server re-exports them from `@simplewebauthn/server`; browser re-exports them from `@simplewebauthn/browser`). In v13+, these types are structurally identical — they represent the same WebAuthn JSON format. Consumers using both packages can import from either; TypeScript's structural type system ensures compatibility. Document this in consumer guidance (§7).

---

## 4. Error context format

### What `captureAsyncResult` already does

```typescript
export async function captureAsyncResult<T>(func: () => Promise<T>): Promise<Result<T>> {
  try {
    return succeed(await func());
  } catch (err: unknown) {
    return fail(_errorMessage(err));
  }
}

function _errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
```

Behavior:
- `Error` instances: `err.message` is captured — the human-readable error string
- Non-Error thrown values: converted to string via `String()`
- Error class/type is NOT preserved in the Result value (Result is value-shaped, not exception-shaped)

### @simplewebauthn error message quality

The upstream library throws descriptive `Error` instances with human-readable messages. Examples from the codebase and documentation:
- `"The authenticator response contained invalid attestation"`
- `"Challenge is not in the correct format"`
- `"Unexpected authentication response type"`
- `"Credential counter value for given response must be larger than 0"`

These messages are self-describing; callers do not need a function-name prefix to understand what failed.

### Decision: captureAsyncResult bare — no additional prefix

**Rationale:**
1. Upstream error messages are descriptive and self-identifying
2. The D1 principle (Result-integration boundary only, no opinion baked in) argues against adding fgv-level framing around upstream messages
3. Consumers wrapping these primitives in their own opinionated ceremony orchestration will add their own context via `.withErrorFormat()` — adding a prefix at our layer creates double-wrapping in the common case
4. Callers pattern-matching on upstream error strings (for specific error handling) should not be broken by a prefix injection
5. captureAsyncResult's error capture is already the established fgv pattern for this purpose

**What this means for consumers:** if a consumer wants `"webauthn registration: <upstream message>"` as their error format, they write:
```typescript
const result = await generateRegistrationOptions(opts)
  .withErrorFormat((msg) => `webauthn registration: ${msg}`);
```
This is the correct layer for that concern — the consumer's opinionated wrapper.

**Error class preservation:** not needed. The class name is not information that flows through Result's value-shaped error model, and callers who need exception-level inspection should not be using this boundary.

---

## 5. Type re-export discipline

**Strategy: re-export all types that appear in the wrapped function signatures (input types and output types, transitively one level).**

Rationale: consumers need to construct inputs and handle outputs without a second `import ... from '@simplewebauthn/*'` statement. But types used inside those types (e.g., `AuthenticatorTransportFuture`, `COSEAlgorithmIdentifier`, `AttestationFormat`) are used in more advanced configuration and are better imported directly from `@simplewebauthn/server` — forcing callers to know that package exists for those types is fine.

### Server package re-exports (`@fgv/ts-extras-webauthn`)

Types appearing directly in our six server-side signatures:

| Type | Used in | Source |
|---|---|---|
| `GenerateRegistrationOptionsOpts` | input to `generateRegistrationOptions` | upstream export |
| `PublicKeyCredentialCreationOptionsJSON` | return from `generateRegistrationOptions` | upstream export |
| `VerifyRegistrationResponseOpts` | input to `verifyRegistrationResponse` | **our alias** (`Parameters<>`) |
| `VerifiedRegistrationResponse` | return from `verifyRegistrationResponse` | upstream export |
| `RegistrationResponseJSON` | field in `VerifyRegistrationResponseOpts.response` | upstream export |
| `GenerateAuthenticationOptionsOpts` | input to `generateAuthenticationOptions` | upstream export |
| `PublicKeyCredentialRequestOptionsJSON` | return from `generateAuthenticationOptions` | upstream export |
| `VerifyAuthenticationResponseOpts` | input to `verifyAuthenticationResponse` | **our alias** (`Parameters<>`) |
| `VerifiedAuthenticationResponse` | return from `verifyAuthenticationResponse` | upstream export |
| `AuthenticationResponseJSON` | field in `VerifyAuthenticationResponseOpts.response` | upstream export |
| `WebAuthnCredential` | field in `VerifyAuthenticationResponseOpts.credential` | upstream export |

Types NOT re-exported (consumers import from `@simplewebauthn/server` directly if needed):
- `AuthenticatorTransportFuture`, `COSEAlgorithmIdentifier`, `AuthenticatorSelectionCriteria`
- `AttestationFormat`, `CredentialDeviceType`, `Base64URLString`, `Uint8Array_`
- `AuthenticationExtensionsClientInputs`, `AuthenticationExtensionsAuthenticatorOutputs`
- `AttestationConveyancePreference` and other deep option types

### Browser package re-exports (`@fgv/ts-web-extras-webauthn`)

| Type | Used in | Source |
|---|---|---|
| `StartRegistrationOpts` | input to `startRegistration` | upstream export |
| `RegistrationResponseJSON` | return from `startRegistration` | upstream export |
| `StartAuthenticationOpts` | input to `startAuthentication` | upstream export |
| `AuthenticationResponseJSON` | return from `startAuthentication` | upstream export |

Types NOT re-exported (consumers import from `@simplewebauthn/browser` directly if needed):
- `PublicKeyCredentialCreationOptionsJSON`, `PublicKeyCredentialRequestOptionsJSON` (these are inputs to the upstream opts types — consumers building the optionsJSON can import them from `@simplewebauthn/browser` or from our server package)

### The two-import-statement question

A consumer using `verifyAuthenticationResponse` and needing to store/retrieve `WebAuthnCredential` shapes in their database will import `WebAuthnCredential` from `@fgv/ts-extras-webauthn`. They do NOT need to import `@simplewebauthn/server` for the common path. This is the correct ergonomic target.

---

## 6. Version-pin strategy

### Pin style in package.json

Use **caret (`^13.0.0`)** for `@simplewebauthn/server` and `@simplewebauthn/browser` in the new packages.

**Rationale:** caret allows patch and minor updates within v13.x automatically. Given the library's track record (changelogs are comprehensive; the authors clearly mark breaking changes with `**Breaking**`), caret within a major version is safe. Pinning to exact or tilde would impose maintenance overhead on every patch release from upstream for no safety benefit.

### Rush preferredVersions discipline

Add both packages to `common/config/rush/common-versions.json` `preferredVersions`:
```json
"preferredVersions": {
  "@simplewebauthn/server": "^13.0.0",
  "@simplewebauthn/browser": "^13.0.0"
}
```
This ensures any transitive consumers of these packages in the monorepo converge on the same version range and avoids duplicate installs.

### Review cadence

- **Security advisory:** immediately. If a CVE or security advisory affects `@simplewebauthn/*`, update and bump within days.
- **Major version:** review within 30 days of upstream release. The migration pattern (see below) is well-understood; timeline is workable.
- **Minor/patch:** allow caret to auto-absorb. No proactive review needed; rely on upstream's changelog discipline and our test suite for regression detection.
- **Quarterly review (optional):** during normal maintenance, check whether upstream has shipped any v13.x changes that improve our wrapper. Not blocking.

### Migration shape on upstream major version bump (e.g. v13 → v14)

Pattern (matches fgv's general approach):
1. Wait for v14 to be non-beta
2. Review v14 changelog for changes to our six wrapped function signatures
3. If signatures are backward-compatible: bump `^14.0.0` in both packages, update preferredVersions, run tests, ship
4. If signatures break: update wrappers + type aliases in a single commit; re-export any renamed types; bump minor version on the fgv packages (since the downstream API surface may change for consumers); document in CHANGELOG

**The `Parameters<typeof fn>[0]` alias idiom pays off here:** if upstream renames the options interface, our `VerifyRegistrationResponseOpts = Parameters<typeof _verifyRegistrationResponse>[0]` alias auto-updates with no code change. Only if we're re-exporting a named upstream type that changed would we need to touch our re-export list.

**No deprecated-and-old shim pattern.** The active-development discipline (ACTIVE_DEVELOPMENT.md) applies — these new packages have no compat burden. Break and fix consumers when upstream breaks.

---

## 7. Documentation and consumer guidance

The section to add to `LIBRARY_CAPABILITIES.md` after phase B:

---

### `@fgv/ts-extras-webauthn` + `@fgv/ts-web-extras-webauthn` — WebAuthn Result boundary

[libraries/ts-extras-webauthn](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-webauthn)  
[libraries/ts-web-extras-webauthn](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras-webauthn)

**These packages are a Result-integration boundary over `@simplewebauthn/server` and `@simplewebauthn/browser` — not an opinionated WebAuthn helper.** The upstream libraries are excellent; these packages add exactly one thing: converting `@simplewebauthn`'s throw-on-failure interface into `Promise<Result<T>>`.

**Six primitive operations. Nothing else.**

| Package | Function | Return |
|---|---|---|
| `@fgv/ts-extras-webauthn` | `generateRegistrationOptions(opts)` | `Promise<Result<PublicKeyCredentialCreationOptionsJSON>>` |
| `@fgv/ts-extras-webauthn` | `verifyRegistrationResponse(opts)` | `Promise<Result<VerifiedRegistrationResponse>>` |
| `@fgv/ts-extras-webauthn` | `generateAuthenticationOptions(opts)` | `Promise<Result<PublicKeyCredentialRequestOptionsJSON>>` |
| `@fgv/ts-extras-webauthn` | `verifyAuthenticationResponse(opts)` | `Promise<Result<VerifiedAuthenticationResponse>>` |
| `@fgv/ts-web-extras-webauthn` | `startRegistration(opts)` | `Promise<Result<RegistrationResponseJSON>>` |
| `@fgv/ts-web-extras-webauthn` | `startAuthentication(opts)` | `Promise<Result<AuthenticationResponseJSON>>` |

**Explicitly NOT in scope:**
- Attestation policy selection
- Challenge state management or challenge stores
- PRF, LargeBlob, or any other extension helpers
- Algorithm allowlist presets
- Registration or authentication ceremony orchestration
- Credential table or user database abstractions
- Session token issuance

For anything not in the table above, **use `@simplewebauthn/server` or `@simplewebauthn/browser` directly** (with try/catch or `captureAsyncResult`).

**The recommended consumer pattern:**

These packages are the foundation layer. Build a consumer-specific opinionated wrapper on top:

```typescript
// Your wrapper adds policy, state, and ceremony orchestration
// Our package supplies the Result-integrated primitive
async function completeAuthentication(
  response: AuthenticationResponseJSON,
  challenge: string,
  credential: WebAuthnCredential
): Promise<Result<AuthSessionInfo>> {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: env.ORIGIN,
    expectedRPID: env.RP_ID,
    credential,
  })
    .withErrorFormat((msg) => `webauthn authentication: ${msg}`)
    .onSuccess((result) => succeed(buildSessionInfo(result)));
}
```

**Shared types:** `RegistrationResponseJSON` and `AuthenticationResponseJSON` are exported from both packages. If using both packages, import these types consistently from one — the types are structurally identical (same WebAuthn JSON format). For server-side type needs, prefer importing from `@fgv/ts-extras-webauthn`; for browser-side, from `@fgv/ts-web-extras-webauthn`.

**Use `rush add` to add these packages:**
```bash
rush add -p @fgv/ts-extras-webauthn      # server-side consumers
rush add -p @fgv/ts-web-extras-webauthn  # browser-side consumers
```

---

## 8. PRF extension — flag if anything special needed

**Confirmed: no special handling needed in the boundary wrapper.**

The WebAuthn PRF (Pseudo-Random Function) extension flows entirely through standard `AuthenticationExtensionsClientInputs` — the DOM-standard `extensions` field that is already present in `generateRegistrationOptions` and `generateAuthenticationOptions` as an optional parameter. PRF evaluation results come back in `authenticatorExtensionResults` in the verify function return types.

**How PRF flows through our six primitives:**

1. **Registration — server side (`generateRegistrationOptions`):** caller includes PRF eval request in `options.extensions.prf` (e.g., `{ eval: { first: saltBytes } }`). This goes through as-is via our passthrough wrapper.

2. **Registration — browser side (`startRegistration`):** caller passes the options JSON received from the server (which includes the prf extension) as `options.optionsJSON`. The browser's `navigator.credentials.create()` processes the extension. `startRegistration` returns a `RegistrationResponseJSON` whose `clientExtensionResults.prf` field contains the PRF availability indicator.

3. **Authentication — server side (`generateAuthenticationOptions`):** same extension field approach for authentication challenges.

4. **Authentication — browser side (`startAuthentication`):** caller passes options including prf extension inputs; `startAuthentication` invokes `navigator.credentials.get()` and returns `AuthenticationResponseJSON` whose `clientExtensionResults.prf` field contains the PRF output (`{ results: { first: Uint8Array } }`).

5. **Verification — server side (`verifyRegistrationResponse`, `verifyAuthenticationResponse`):** the `authenticatorExtensionResults` field in the return type contains the server-parsed extension results. The PRF output for the consumer's key-derivation step is available there.

**Import path:** PRF types (`AuthenticationExtensionsClientInputs`, `AuthenticationExtensionsAuthenticatorOutputs`) come from the standard DOM types. `@simplewebauthn/server` and `@simplewebauthn/browser` use these types as-is. No separate `@simplewebauthn/server/prf` import path exists.

**SimpleWebAuthn's stated position on PRF:** the upstream maintainers have explicitly stated they do not plan to make PRF simpler through helpers, due to the security implications of tying encryption material to a passkey. This is aligned with our D3 discipline — we also do not add PRF helpers. PRF is the caller's problem; it flows through our boundary transparently.

**Source:** https://github.com/MasterKale/SimpleWebAuthn/discussions/583; https://developers.yubico.com/WebAuthn/Concepts/PRF_Extension/

---

## 9. Implementation plan

### Phase B scope

Two new packages, six functions, tests for all six, LIBRARY_CAPABILITIES.md update.

#### Step 1: Rush registration and scaffolding

1. Register both packages in `rush.json` (entries specified in §2)
2. Create `libraries/ts-extras-webauthn/` directory tree:
   - `package.json` with `@simplewebauthn/server ^13.0.0` as runtime dependency
   - `tsconfig.json` extending `@rushstack/heft-node-rig/profiles/default/tsconfig-base.json`
   - `config/rig.json` pointing to `@fgv/heft-dual-rig`
   - `config/jest.config.json` with 100% coverage threshold
   - `config/api-extractor.json` (copy from ts-utils-jest pattern)
   - `CHANGELOG.json` (empty initial)
3. Create `libraries/ts-web-extras-webauthn/` directory tree:
   - Same structure; `package.json` depends on `@simplewebauthn/browser ^13.0.0`
   - `config/jest.config.json` with `testEnvironment: "jsdom"` and 100% coverage threshold
4. Run `rush install` to wire up the new packages

#### Step 2: Server package implementation

Single file: `src/index.ts`

Content: exact code from §3 (server section). Four functions, type re-exports, `Parameters<>` aliases.

No packlets needed — the package is a single-purpose boundary wrapper with four functions. Flat structure is appropriate.

#### Step 3: Browser package implementation

Single file: `src/index.ts`

Content: exact code from §3 (browser section). Two functions, type re-exports.

#### Step 4: Test coverage strategy

**Mock strategy:** jest.mock the upstream library. Do NOT use the real `@simplewebauthn` in tests — that would require a real WebAuthn ceremony with an authenticator. The thing being tested is captureAsyncResult integration, not WebAuthn ceremony correctness.

**Per-primitive test pattern:**

```typescript
import { jest } from '@jest/globals';
jest.mock('@simplewebauthn/server');

import { generateRegistrationOptions } from '../index';
import * as upstream from '@simplewebauthn/server';

describe('generateRegistrationOptions', () => {
  const mockOpts = { rpName: 'Test', rpID: 'test.example.com', userName: 'user@test.com' };
  const mockResult = { challenge: 'abc123', /* ... */ } as PublicKeyCredentialCreationOptionsJSON;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns Success wrapping upstream result on success', async () => {
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

Minimum 2 tests per primitive (success + failure) = 12 tests minimum across both packages.

Coverage note: captureAsyncResult's failure branch will be exercised by the rejection test. The success branch by the resolution test. 100% coverage is achievable with this pattern.

#### Step 5: LIBRARY_CAPABILITIES.md addition

Add the section from §7 to `.ai/instructions/LIBRARY_CAPABILITIES.md` under a new "WebAuthn" subsection in the "Specialized utilities" section (or its own top-level section alongside ts-extras and ts-web-extras). Exact placement: after the `@fgv/ts-web-extras` section.

#### Step 6: PR

Single PR targeting `claude/crypto-batch-2-features` containing both new packages + LIBRARY_CAPABILITIES.md update.

---

### What the orchestrator needs for the phase B brief

- Two new packages created from scratch (no existing package to clone exactly, but ts-utils-jest and ts-web-extras provide structural precedent)
- Test environment: jsdom for browser package, node for server package
- The six signatures in §3 are the canonical implementation spec; implementer should not deviate
- Version pin: `^13.0.0` for both upstream packages
- Mock strategy: jest.mock in all tests; no real WebAuthn ceremony in tests

---

## 10. Migration impact

**Zero impact on existing consumers.** Both packages are net-new additions.

Existing packages (`@fgv/ts-extras`, `@fgv/ts-web-extras`, `@fgv/ts-utils`, etc.) are not modified. No exports are removed or renamed. No types change. The new packages appear at new import paths; nothing points at them except new consumers who opt in.

The `rush.json` addition and `common-versions.json` `preferredVersions` additions are additive and do not affect any existing package's behavior.

Confirmed zero migration impact.

---

## 11. Open questions for signoff

**OQ-1: Directory location — `libraries/` vs. a new `integrations/` top level**

The WORKSTREAMS.md ledger note (§ `crypto-batch-2-webauthn`) flags this: "The 'Result-integration boundary over a well-maintained upstream library' pattern is worth codifying as a fgv convention after this stream lands. Plus the question of whether such packages belong in `libraries/` or a top-level `integrations/` directory."

This design places both packages in `libraries/` — same as the Argon2 stream — for consistency with the existing pattern. If the orchestrator/user wants to pilot an `integrations/` top-level directory with this stream, the change is a mechanical rename of the project folder. The design is otherwise unaffected.

**Recommendation:** use `libraries/` now; the convention question can be addressed in the lessons-codification step after the cluster lands.

---

**OQ-2: Whether to include `@simplewebauthn/types` as a transitive dependency**

In v13+, types are exported directly from `@simplewebauthn/server` and `@simplewebauthn/browser` — the separate `@simplewebauthn/types` package is no longer required. This design assumes v13+ and does NOT include `@simplewebauthn/types` as a dependency.

If the orchestrator decides to support v12 consumers as well, `@simplewebauthn/types` would need to be re-examined. **Recommendation:** target v13+ only (current stable major). No question blocking.

---

**OQ-3: `VerifyRegistrationResponseOpts` naming**

This design defines `VerifyRegistrationResponseOpts` as our own `Parameters<>` alias because upstream does not export a named type for the verifyRegistrationResponse options object. Same for `VerifyAuthenticationResponseOpts`.

This means these types live in our package's namespace, not upstream's. There is a risk that if upstream ships `VerifyRegistrationResponseOpts` in v14, consumers would have two import paths for the same type (ours and upstream's). Not blocking — but worth flagging.

**Recommendation:** accept this risk; the `Parameters<>` alias guarantees structural identity.

---

**OQ-4: Temptations to add abstraction that this design explicitly rejected (record for D3 compliance)**

The following abstractions were tempting during research and explicitly rejected:

1. **Challenge generator helper** — upstream's `generateRegistrationOptions` and `generateAuthenticationOptions` can generate challenges automatically; nothing to add here. ✗ rejected per D3.

2. **PRF salt helper** — converting a string or Buffer to the `Uint8Array` format needed for the PRF extension `eval.first` field. Out of scope: PRF is caller's concern. ✗ rejected per D3.

3. **`browserAutofillInput` validator** — `startAuthentication`'s `verifyBrowserAutofillInput` option does input element validation. A helper to add the correct `autocomplete` attribute to input elements was tempting. ✗ rejected per D3.

4. **`WebAuthnCredential` builder** — a helper to construct the `WebAuthnCredential` object from registration verification output for storage. Structurally appealing (DRY across consumers). ✗ rejected per D3: credential storage is the caller's responsibility.

All four are caller-side concerns. None of them belong in a Result-integration boundary.

---

## References

- SimpleWebAuthn GitHub: https://github.com/MasterKale/SimpleWebAuthn
- SimpleWebAuthn CHANGELOG: https://github.com/MasterKale/SimpleWebAuthn/blob/master/CHANGELOG.md
- `@simplewebauthn/server` source — generateRegistrationOptions: https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/server/src/registration/generateRegistrationOptions.ts
- `@simplewebauthn/server` source — verifyRegistrationResponse: https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/server/src/registration/verifyRegistrationResponse.ts
- `@simplewebauthn/server` source — generateAuthenticationOptions: https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/server/src/authentication/generateAuthenticationOptions.ts
- `@simplewebauthn/server` source — verifyAuthenticationResponse: https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/server/src/authentication/verifyAuthenticationResponse.ts
- `@simplewebauthn/browser` source — startRegistration: https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/browser/src/methods/startRegistration.ts
- `@simplewebauthn/browser` source — startAuthentication: https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/browser/src/methods/startAuthentication.ts
- PRF extension discussion: https://github.com/MasterKale/SimpleWebAuthn/discussions/583
- YubiKey PRF developer guide: https://developers.yubico.com/WebAuthn/Concepts/PRF_Extension/Developers_Guide_to_PRF.html
- fgv `ts-utils-jest` reference precedent: `libraries/ts-utils-jest/`
- fgv `captureAsyncResult` implementation: `libraries/ts-utils/src/packlets/base/result.ts`
