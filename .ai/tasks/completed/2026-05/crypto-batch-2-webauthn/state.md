# Stream State: crypto-batch-2-webauthn

**Status:** 🟢 phase A signed off; phase B ready to start
**Last updated:** 2026-05-12 (orchestrator — phase B brief authored)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ done | design.md merged into `claude/crypto-batch-2-features` (via consolidated phase-B prep) |
| B — implementation | 🟢 ready | `brief-phase-b.md` is the binding contract; assignable to implementing agent |

---

## Phase A signoff summary (orchestrator)

Design approved **as designed** — the Result-integration-boundary discipline (six primitives, nothing else) is exactly the right shape. Open question resolutions:

- **OQ-1 (libraries/ vs integrations/):** stay in `libraries/`. The `integrations/` convention question is a separate lessons-codification chore.
- **OQ-2 (v12 support):** v13+ only. Do not include `@simplewebauthn/types`.
- **OQ-3 (`VerifyRegistrationResponseOpts` namespace duplication risk):** accept; `Parameters<>` alias guarantees structural identity.
- **OQ-4 (rejected abstractions):** the four temptations stay rejected. The phase B brief encodes them as a "don't" list — abstraction creep is the failure mode for this stream.

PR #342 (the phase A draft) is being superseded by the consolidated cluster work. Orchestrator will close it when the prep PR merges; implementing agent does not need to touch it.

Phase B contract is baked into `.ai/tasks/active/crypto-batch-2-webauthn/brief-phase-b.md`. Where the brief conflicts with the design, the brief wins.

---

## Work branch

`claude/webauthn-batch-design-LqIDQ` (harness-assigned)

PR target: `claude/crypto-batch-2-features`

---

## Work branch

`claude/webauthn-batch-design-LqIDQ` (harness-assigned)

PR target: `claude/crypto-batch-2-features`

---

## Decisions log

| Decision | Choice | Rationale |
|---|---|---|
| Upstream version | `^13.0.0` for both packages | v13.3.0 is current stable; caret allows patch/minor auto-update; v13 removed the separate `@simplewebauthn/types` dependency |
| Error context format | `captureAsyncResult` bare, no prefix | Upstream errors are self-describing; consumer-level wrapping adds context via `.withErrorFormat()`; D1 principle |
| Options type aliases for verify functions | `Parameters<typeof fn>[0]` | Upstream does not export named aliases for `verifyRegistrationResponse` / `verifyAuthenticationResponse` opts; `Parameters<>` guarantees structural sync |
| Type re-export scope | Selective — types in signatures only | Avoids pulling the entire upstream API surface into our namespace; one-import ergonomic for common path |
| PRF extension handling | None — flows through standard `extensions` field | Confirmed no special handling needed; PRF is caller's responsibility |
| Directory location | `libraries/` (both packages) | Consistent with Argon2 stream; `integrations/` question deferred to post-cluster lessons |
| Test strategy | jest.mock upstream; success + failure per primitive | Cannot run real WebAuthn ceremony in tests; captureAsyncResult integration is what we're testing |

---

## Recommendation summary

Design is straightforward: two new packages (`@fgv/ts-extras-webauthn` for Node, `@fgv/ts-web-extras-webauthn` for browser), each containing thin `captureAsyncResult` wrappers around `@simplewebauthn/server` and `@simplewebauthn/browser` respectively. Exactly six functions total. No opinion, no ceremony orchestration, no helpers above the primitive level. The D3 no-abstraction-creep discipline held throughout research — four specific abstraction temptations were identified and rejected (documented in §11 OQ-4 of design.md). The PRF extension flows through unchanged via the standard `AuthenticationExtensionsClientInputs` field; no special handling is needed at the boundary. Phase B is a mechanical implementation against the signatures in §3 of design.md, estimated at medium complexity (two new package scaffoldings + six trivial function bodies + tests).

---

## Research findings

**@simplewebauthn stability:**
- v13.3.0 is current (released 2026-03-10); active maintenance; releases in lockstep server+browser
- Signature-level stability since v11 (v12 added JSR support, v13 added registration hints and trust anchor improvements)
- v13 eliminates the separate `@simplewebauthn/types` dependency — all types now exported from the main packages
- MIT license confirmed

**Version-pin pattern:**
- `^13.0.0` in package.json (caret allows patch/minor)
- Rush `preferredVersions` for monorepo consistency
- Security advisory → immediate; major bump → 30-day review window; patch/minor → auto-absorb

**Bundle size (`@simplewebauthn/browser`):**
- Approximately 9.1 KB gzipped — well within acceptable range for a WebAuthn integration library

**PRF extension:**
- Flows through `AuthenticationExtensionsClientInputs.prf` (standard DOM type)
- No separate import path or helper in `@simplewebauthn/*`
- PRF output in `authenticatorExtensionResults.prf.results.first` (Uint8Array)
- Upstream explicitly will NOT simplify PRF — aligns with our D3 no-helpers discipline

---

## Abstraction temptations rejected (D3 compliance record)

1. Challenge generator helper — out of scope
2. PRF salt (string/Buffer → Uint8Array) helper — out of scope
3. Browser autofill input validator — out of scope
4. `WebAuthnCredential` builder from registration output — out of scope

All four documented in design.md §11 OQ-4.

---

## Open questions for orchestrator

| ID | Question | Recommendation |
|---|---|---|
| OQ-1 | `libraries/` vs. `integrations/` directory | Use `libraries/` now; defer convention question to post-cluster lessons |
| OQ-2 | v12 support (requires `@simplewebauthn/types`) | Target v13+ only — no question blocking |
| OQ-3 | `VerifyRegistrationResponseOpts` naming risk (upstream may ship in v14) | Accept risk; `Parameters<>` guarantees structural identity |

---

## PR

[#342](https://github.com/ErikFortune/fgv/pull/342) — `claude/webauthn-batch-design-LqIDQ` → `claude/crypto-batch-2-features`
