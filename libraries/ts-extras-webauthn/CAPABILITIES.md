# `@fgv/ts-extras-webauthn` + `@fgv/ts-web-extras-webauthn` — WebAuthn Result boundary

> **This file is authoritative for what ``@fgv/ts-extras-webauthn`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

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

**Explicitly NOT in scope (these were considered and explicitly rejected):**
- Challenge generator helpers
- PRF salt helper / Uint8Array conversion helpers
- `browserAutofillInput` validator / `autocomplete` attribute helpers
- `WebAuthnCredential` builder from verification output
- Attestation policy presets
- Algorithm allowlist presets
- Challenge state management or challenge stores
- Session token issuance
- Registration or authentication ceremony orchestration
- Credential / user database abstractions

For anything not in the table above, **use `@simplewebauthn/server` or `@simplewebauthn/browser` directly** (with `captureAsyncResult` for your own Result wrapping). These packages are a thin boundary layer; build your opinionated ceremony orchestration on top.

**Version:** `^13.0.0` for both upstream packages.

---

---

## Decision shortcuts

- **Need a Result-integrated WebAuthn registration / authentication primitive (server-side)?** → `generateRegistrationOptions` / `verifyRegistrationResponse` / `generateAuthenticationOptions` / `verifyAuthenticationResponse` from `@fgv/ts-extras-webauthn`. Wraps `@simplewebauthn/server`. Caller still owns ceremony orchestration, challenge management, and credential storage.
- **Note (WebAuthn):** `@fgv/ts-extras-webauthn` and `@fgv/ts-web-extras-webauthn` do NOT include PRF helpers, challenge generators, attestation policy, or credential storage. For anything beyond the Result boundary, call `@simplewebauthn/*` directly.

---

## Recent additions

*Newest first. Populated from each stream's `summary.sourceLine` — see the split brief's phase 2.*
