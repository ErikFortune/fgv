# Stream State: auth-primitives-batch1

**Status:** ✅ complete — implementation committed and pushed; PR ready to open
**Last updated:** 2026-05-10 (implementing agent)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — X25519 keypair | ✅ complete | model.ts, keyPairAlgorithmParams.ts, and tests already present on branch |
| 2 — Multibase/SPKI helpers | ✅ complete | spkiHelpers.ts created; exports added to index.ts + index.browser.ts; spkiHelpers.test.ts added |
| 3 — RFC 8785 canonicalization | ✅ complete | canonicalize() added to HashingNormalizer; tests added to hash.test.ts |
| 4 — LIBRARY_CAPABILITIES.md | ✅ complete | crypto-utils and hash descriptions expanded; decision shortcuts added |

---

## Decisions log

### Phase 1: X25519
- All changes (model.ts union extension, allKeyPairAlgorithms array, keyPairAlgorithmParams table entry, Node and browser test files) were already present on the branch when the implementing agent started.
- Both providers (NodeCryptoProvider, BrowserCryptoProvider) are fully table-driven — no provider changes needed.

### Phase 3: canonicalize() attachment point
- Attached to `HashingNormalizer` (not the base `Normalizer`).
- Rationale: the brief's preferred attachment point; `Normalizer` is the foundational base class with no dependencies, and `JsonValue` type is defined in `@fgv/ts-json-base` which `ts-utils` does not depend on. A local `type JsonValue` alias was added at file scope (marked `@internal`) to avoid adding a new package dependency.
- The method uses direct string emission (recursive descent) rather than constructing a JS object, to prevent integer-string key reordering by JS engines.

### Phase 2: spkiHelpers.ts
- Four functions implemented as pure module-level exports (not class methods), per the brief.
- `btoa`/`atob` used for base64 encoding/decoding — available in both Node 16+ and all modern browsers. NodeCryptoProvider uses Buffer-based base64 for its own methods; we use `btoa`/`atob` here because spkiHelpers is cross-runtime (also exported from index.browser.ts).
- `importPublicKeyFromMultibaseSpki` uses `params.importPublicKey as AlgorithmIdentifier` (same pattern as providers) to steer TypeScript to the correct overload.

---

## Open questions / blockers

*(none)*

---

## PR

- Branch: `origin/claude/auth-primitives-batch1`
- Commit: `ad0d33db` — feat(auth-primitives-batch1): add X25519 keypair, SPKI helpers, RFC 8785 canonicalize, and LIBRARY_CAPABILITIES update
- PR: https://github.com/ErikFortune/fgv/pull/322 (opened by orchestrator via GitHub MCP)
- Status: open against `release`, awaiting review and `5.1.0-26` publish

## Orchestrator review notes

- Spot-checked `canonicalize` (recursive descent emits to string, no JS object reconstruction — load-bearing detail correct) and `spkiHelpers.ts` (cross-runtime via `globalThis.crypto.subtle` + `btoa`/`atob`)
- Minor style: `importPublicKeyFromMultibaseSpki` early-returns on `isFailure()` instead of `.onSuccess`-chaining the sync→async transition. Not blocking.
- Architectural follow-up: agent attached `canonicalize` to `HashingNormalizer` with a local internal `JsonValue` alias to avoid `ts-utils → ts-json-base`. The base `Normalizer` is the cleaner long-term home; revisit once a shared `JsonValue` is hoisted or the dependency is accepted. Candidate for `TECH_DEBT.md` P3.
