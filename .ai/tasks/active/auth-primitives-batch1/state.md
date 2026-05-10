# Stream State: auth-primitives-batch1

**Status:** 🔵 in flight — implementation complete, building/testing
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

*(to be filled after PR opened)*
