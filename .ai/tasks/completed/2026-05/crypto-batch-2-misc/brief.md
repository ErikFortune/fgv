# Stream Brief: crypto-batch-2-misc (implementation only)

**Stream ID:** crypto-batch-2-misc
**Cluster:** crypto-batch-2 (integration branch `claude/crypto-batch-2-features`)
**Phase:** Implementation-only (no design phase)
**Sequencing:** May run in parallel with the other crypto-batch-2 streams' phase A (this stream is small, well-specified, and touches existing `ICryptoProvider` rather than new packages or new namespaces).

---

## Context

Two small additions to `ICryptoProvider` that don't warrant their own design phase:

1. **`sign` / `verify` wrappers** on `ICryptoProvider`. Today, consumers reach for raw `crypto.subtle.sign({ name: 'Ed25519' }, ...)` and `crypto.subtle.verify(...)`. This works in both Node and modern browsers for standard algorithms, but reaching for raw `crypto.subtle` means consumers absorb any future cross-runtime differences themselves — and if they get it wrong, *their* consumers also have to choose correctly, cascading the cost.

   `ICryptoProvider`'s whole point is to absorb cross-runtime adaptation. Sign/verify belong inside it for the same reason every other crypto operation does. The wrapper costs near-zero today (both runtimes converge on `crypto.subtle.sign`) and pays off the day adaptation matters.

2. **`timingSafeEqual` standalone** on `ICryptoProvider`. After `5.1.0-26`, `KeyStore.verifySecretFromPassword` covers the primary password-verification use case. But callers comparing raw bytes outside the keystore pattern (MAC outputs, signed-token comparisons, anything needing constant-time equality) still need a primitive.

The full consumer-side context is at `.ai/notes/cross-repo-handoffs/fgv-batch-2-handoff-2026-05.md`.

### Decisions already made (orchestrator + user, 2026-05-11)

- **D1 — `sign`/`verify` wrappers added.** Q7 resolved: add the wrappers. The "concentration of cross-runtime adaptation in `ICryptoProvider`" argument outweighed the "no current divergence" argument. Cost is near-zero today; future-proofing is real.
- **D2 — `timingSafeEqual` added.** Small standalone primitive on `ICryptoProvider`. Node provides `crypto.timingSafeEqual` natively; browser side needs a constant-time XOR-walk implementation.
- **D3 — Both land in existing `crypto-utils` packlets.** Not new packages; these are additions to the existing `ICryptoProvider` interface and its Node/Browser implementations.

---

## Mission

Implement `sign`, `verify`, and `timingSafeEqual` on `ICryptoProvider`. Both Node and Browser implementations. 100% test coverage. `LIBRARY_CAPABILITIES.md` update.

This is a small implementation-only stream — no design.md, no signoff gate, straight to a PR.

---

## Deliverables

### 1. `ICryptoProvider.sign` / `verify`

Add to `ICryptoProvider` (in `model.ts`):

```typescript
sign(privateKey: CryptoKey, data: Uint8Array): Promise<Result<Uint8Array>>;
verify(publicKey: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<Result<boolean>>;
```

(Refine signatures as needed — pre-implementation should think through whether the algorithm needs to be a separate parameter or whether it should be inferred from the key's `algorithm` property. The key carries its algorithm; defaulting to that is probably right.)

Both Node and Browser implementations delegate to `crypto.subtle.sign` / `crypto.subtle.verify` with the algorithm pulled from the key. Wrap with `captureAsyncResult` for Result-integration. Failure messages should preserve underlying error context.

### 2. `ICryptoProvider.timingSafeEqual`

Add to `ICryptoProvider` (in `model.ts`):

```typescript
timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
```

Note: synchronous, returns `boolean` directly (not `Result<boolean>` — the operation has only one meaningful failure mode, "inputs are different lengths," and the natural response is `false`, not Result.fail).

**Node implementation:** delegate to `crypto.timingSafeEqual`. Returns `false` on length mismatch (which Node's native throws on, so wrap that check).

**Browser implementation:** constant-time XOR-walk. Reference implementation pattern:

```typescript
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
```

Verify the XOR-walk genuinely is constant-time (no early-return; bitwise-OR accumulation). Document this property in JSDoc.

### 3. Tests

100% coverage required (per repo convention). For each method:
- Success case (valid keys/inputs, expected output)
- Failure case (where applicable — bad key, signature mismatch)
- Edge cases (empty data, single-byte inputs, length mismatches for timingSafeEqual)
- Round-trip tests (sign then verify; both succeed for matching key, fail for mismatched key)

Use `@fgv/ts-utils-jest` matchers — `toSucceedWith`, `toFail`, etc. (Note: per `.ai/instructions/TESTING_GUIDELINES.md`, `toSucceedAndSatisfy` for complex assertions.)

### 4. `LIBRARY_CAPABILITIES.md` update

Add `sign`, `verify`, and `timingSafeEqual` to the `crypto-utils` § listing of `ICryptoProvider` operations. Brief — they fit alongside the existing operation enumeration.

---

## Package surface

### In-scope (modify)

- `libraries/ts-extras/src/packlets/crypto-utils/model.ts` — `ICryptoProvider` interface additions
- `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` — Node implementations
- `libraries/ts-extras/src/packlets/crypto-utils/index.ts` — export if any new types
- `libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts` — same
- `libraries/ts-extras/src/test/unit/crypto/` — tests for the new methods (existing test patterns to follow)
- `libraries/ts-extras/etc/ts-extras.api.md` — regenerate via api-extractor
- `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` — Browser implementations
- `libraries/ts-web-extras/src/test/unit/` — Browser tests
- `libraries/ts-web-extras/etc/ts-web-extras.api.md` — regenerate
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — `crypto-utils` section update

### Out-of-scope

- HPKE (parallel stream)
- Argon2id (parallel stream; lives in new packages)
- WebAuthn (parallel stream; lives in new packages)
- Any package outside `crypto-utils` packlets
- KeyStore — unchanged
- Sudoku packages

---

## Required reading

1. `libraries/ts-extras/src/packlets/crypto-utils/model.ts` — current `ICryptoProvider` interface
2. `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` — Node implementation patterns
3. `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` — Browser implementation patterns
4. `libraries/ts-extras/src/test/unit/crypto/` — test patterns
5. `.ai/notes/cross-repo-handoffs/fgv-batch-2-handoff-2026-05.md` — consumer context (items 5 and 6)
6. `.ai/instructions/CODING_STANDARDS.md` — Result pattern, no-`any`, factory pattern
7. `.ai/instructions/TESTING_GUIDELINES.md` — Result matchers, coverage requirements

---

## Skills to load (when conditions trigger)

- `/result-pattern` — load before writing any function returning `Result<T>`. (`sign` and `verify` return Result; `timingSafeEqual` does not, but the implementation will inevitably touch Result-shaped surfaces nearby.)
- `/result-tests` — load before writing tests. Use Result matchers.
- `/published-primitives-reflex` — load if you find yourself reaching for utility helpers. The timing-safe XOR walk is short enough to inline; don't overthink.

---

## Acceptance criteria

- [ ] `ICryptoProvider` interface declares `sign`, `verify`, `timingSafeEqual`
- [ ] `NodeCryptoProvider` implements all three
- [ ] `BrowserCryptoProvider` implements all three
- [ ] Round-trip sign-then-verify tests pass for at least Ed25519, ECDSA-P256, RSA-OAEP-2048 (or whatever signing algorithms the current `ICryptoProvider.generateKeyPair` supports; check `model.ts`'s `KeyPairAlgorithm` union)
- [ ] `timingSafeEqual` tests: equal bytes → true; unequal same-length → false; different lengths → false; empty inputs handled
- [ ] Browser `timingSafeEqual` implementation is constant-time (no early-return)
- [ ] 100% coverage in both packages
- [ ] `rushx build` passes in both packages
- [ ] **`rushx lint` passes in both packages** *(load-bearing — NOT transitively run by build; see `.ai/instructions/CODING_STANDARDS.md` § Pre-PR Validation Checklist)*
- [ ] `rushx test` passes with 100% coverage in both
- [ ] **`rushx fixlint` was run before the final commit** *(autofixes the mechanical class — formatting, unused-import sort, missing semicolons, many style rules)*
- [ ] No `any` types
- [ ] No inline lint-rule-disable directives added to make lint pass — if a rule genuinely shouldn't apply, surface to the orchestrator
- [ ] api-extractor regenerated (`ts-extras.api.md`, `ts-web-extras.api.md`)
- [ ] `LIBRARY_CAPABILITIES.md` updated
- [ ] PR opened against `claude/crypto-batch-2-features` (NOT `release`)
- [ ] Pre-merge artifact migration to `.ai/tasks/completed/2026-05/crypto-batch-2-misc/` with polished `README.md` *(write a separate polished README — migrated state.md alone does not fulfill this)*

---

## Exit artifact (state.md)

At completion, `state.md` should record:
- PR number and merge commit
- Test coverage status per file
- Any decisions that differed from this brief (with rationale)
- Any followups surfaced — route to TECH_DEBT, FUTURE, or chore batch

---

## Branch + PR posture

- **Base branch:** `claude/crypto-batch-2-features`
- **Work branch:** `claude/crypto-batch-2-misc-impl` (or harness-auto-suffix; document in state.md)
- **PR target:** `claude/crypto-batch-2-features`

---

## Pre-merge artifact migration

Per the artifact-protocol convention: migrate `.ai/tasks/active/crypto-batch-2-misc/` to `.ai/tasks/completed/2026-05/crypto-batch-2-misc/` (or whatever YYYY-MM matches your merge month) **before merge**, with a polished `README.md`. The prior auth-primitives stream missed this; the previous orchestrator captured it as a lessons-codification item. Don't repeat the slip.

---

## Resume protocol

If the session ends mid-implementation: read `brief.md` (this file) and `state.md` to resume.

---

## Missing-input rule

If a required-reading file is missing or has a conflicting shape (e.g. `crypto.subtle.sign` isn't available in the runtime version we target), **STOP and report**. Do not improvise.

---

## Don't

- Don't redesign the `ICryptoProvider` interface beyond adding the three methods
- Don't add signing-algorithm helpers (algorithm-specific signers); the wrapper is algorithm-agnostic via the key's `algorithm` property
- Don't add `timingSafeEqual` variants (lengths-known, prefix-equality, etc.); the basic primitive is what's asked for
- Don't pull in dependencies for `timingSafeEqual` browser implementation; a 5-line XOR walk is correct and minimal
- Don't touch the HPKE, Argon2id, or WebAuthn surfaces — those are parallel streams
- **Don't open the PR until `rushx build && rushx lint && rushx test` all pass locally** in both modified packages. `rushx build` does NOT transitively run lint; lint is a separate gate. Run `rushx fixlint` before the final commit to autofix the mechanical class of violations.
