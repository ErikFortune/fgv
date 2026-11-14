# Stream Brief: auth-primitives-batch1

**Stream ID:** auth-primitives-batch1  
**Orchestrator:** fgv-side orchestrator  
**Cross-repo context:** personaility `auth-primitives-foundation` (ErikFortune/personaility, branch `claude/auth-primitives-foundation-h34cG`) is blocked on this batch.  
**Publish target:** `5.1.0-26` prerelease — all four items ship together.

---

## Mission

Add four targeted primitives to fgv's crypto/hash surface needed by the personaility auth-primitives workstream:

1. **X25519 keypair** — extend `KeyPairAlgorithm` and `keyPairAlgorithmParams` table; providers pick it up automatically
2. **RFC 8785 canonicalization** — `canonicalize(value: JsonValue): string` on `HashingNormalizer` (or `Normalizer`)
3. **Multibase/SPKI helpers** — standalone helpers in `@fgv/ts-extras/crypto-utils`
4. **LIBRARY_CAPABILITIES.md update** — surface cryptography/keystore/canonicalization for agents

---

## Branch + PR posture

- Branch from `release` at or after baseline `9c4fd555`
- Branch name: `claude/auth-primitives-batch1`
- Open PR to `release` when implementation and tests are complete
- Do NOT merge; the orchestrator reviews before merge

---

## In-scope paths (you may read and modify)

- `libraries/ts-extras/src/packlets/crypto-utils/model.ts`
- `libraries/ts-extras/src/packlets/crypto-utils/keyPairAlgorithmParams.ts`
- `libraries/ts-extras/src/packlets/crypto-utils/index.ts`
- `libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts`
- `libraries/ts-extras/src/packlets/crypto-utils/spkiHelpers.ts` *(new file)*
- `libraries/ts-extras/src/test/unit/crypto/` *(new and existing test files)*
- `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` *(verify; likely read-only)*
- `libraries/ts-web-extras/src/test/unit/` *(new test files)*
- `libraries/ts-utils/src/packlets/hash/hashingNormalizer.ts` *(preferred)* or `libraries/ts-utils/src/packlets/base/normalize.ts`
- `libraries/ts-utils/src/packlets/hash/index.ts` *(export new method)*
- `libraries/ts-utils/src/test/unit/hash.test.ts`
- `.ai/instructions/LIBRARY_CAPABILITIES.md`
- `.ai/tasks/active/auth-primitives-batch1/state.md` *(update at phase checkpoints)*

---

## Out-of-scope paths (do NOT modify)

- `wrapBytes` / `unwrapBytes` — no changes
- `KeyStore` — no changes
- `ICryptoProvider` interface in `model.ts` — no new methods (standalone helpers only, not interface methods)
- Any library not listed above
- `libraries/ts-sudoku-lib`, `libraries/ts-sudoku-ui`, `apps/sudoku` — vestigal, do not touch
- HPKE, Argon2id, WebAuthn — deferred; do not pull in even if they look adjacent

---

## Required reading (priority order)

1. `libraries/ts-extras/src/packlets/crypto-utils/keyPairAlgorithmParams.ts` — master params table; X25519 entry goes here
2. `libraries/ts-extras/src/packlets/crypto-utils/model.ts` — `KeyPairAlgorithm` union, `allKeyPairAlgorithms`, `IKeyPairAlgorithmParams` type unions, `ICryptoProvider.toBase64`/`fromBase64` (standard base64 — NOT base64url; you need separate base64url helpers)
3. `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` — verify `generateKeyPair` and `importPublicKeyJwk` are table-driven (they are); look at `exportPublicKeyJwk` for the SPKI export pattern
4. `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` — confirm `generateKeyPair` and `importPublicKeyJwk` also use the shared table; check test setup in `src/test/setupTests.ts`
5. `libraries/ts-utils/src/packlets/base/normalize.ts` — `Normalizer._compareKeys` implementation; already correct for RFC 8785 lexicographic ordering
6. `libraries/ts-utils/src/packlets/hash/hashingNormalizer.ts` — preferred attachment point for `canonicalize`
7. `libraries/ts-extras/src/test/unit/crypto/nodeCryptoProvider.test.ts` — existing test patterns to follow
8. `libraries/ts-web-extras/src/test/unit/browserCryptoProvider.keyPair.test.ts` — browser test patterns (note: uses `globalThis.crypto` polyfilled via `setupTests.ts`)

---

## Skills to load

- Load `/result-pattern` before writing any function returning `Result<T>` or chaining operations
- Load `/result-tests` before writing any test file

---

## Missing-input rule

If any required-reading file is missing or has a shape that conflicts with these instructions (e.g., `generateKeyPair` is NOT table-driven), **STOP and report** before proceeding. Do not improvise around a structural mismatch.

---

## Dependencies

None outside fgv. No other in-flight stream touches these files.

---

## Phases

### Phase 1 — Item 1: X25519 keypair

1. Read `model.ts` and `keyPairAlgorithmParams.ts` in full.
2. In `model.ts`:
   - Extend `KeyPairAlgorithm` type union: add `'x25519'`
   - Add `'x25519'` to `allKeyPairAlgorithms` array
   - Extend `IKeyPairAlgorithmParams.generateKey` type union: add `| { readonly name: 'X25519' }`
   - Extend `IKeyPairAlgorithmParams.importPublicKey` type union: add `| { readonly name: 'X25519' }`
   - Update JSDoc on `KeyPairAlgorithm` to document `'x25519'` (key-agreement only, Montgomery form Curve25519)
3. In `keyPairAlgorithmParams.ts`: add the `'x25519'` entry:
   - `generateKey: { name: 'X25519' }`
   - `importPublicKey: { name: 'X25519' }`
   - `keyPairUsages: ['deriveKey', 'deriveBits']`
   - `publicKeyUsages: []`
4. Verify `NodeCryptoProvider.generateKeyPair` is purely table-driven — if so, **no other changes needed** to `nodeCryptoProvider.ts`. Same for `BrowserCryptoProvider`.
5. Write tests in `ts-extras` (`nodeCryptoProvider.test.ts` or new file):
   - Generate X25519 keypair (`extractable: true`); assert `privateKey.usages` contains `'deriveKey'` and `'deriveBits'`; assert `publicKey.usages` is empty
   - Export public key as JWK; re-import via `importPublicKeyJwk`; assert the reimported key is usable
   - ECDH: generate two X25519 keypairs; derive shared secret with each pair's private+peer-public; assert both secrets are identical 32 bytes
   - Negative: `extractable: false` then `exportKey` → fails as expected
6. Write matching tests in `ts-web-extras` (`browserCryptoProvider.keyPair.test.ts` or new file), same cases via `BrowserCryptoProvider`.
7. Checkpoint: update `state.md`.

### Phase 2 — Item 3: Multibase/SPKI helpers

*(After Phase 1 — X25519 must be wired for full round-trip test coverage.)*

1. Create `libraries/ts-extras/src/packlets/crypto-utils/spkiHelpers.ts`. Implement:

   **`multibaseBase64UrlEncode(data: Uint8Array): string`**
   - Encode as base64url-no-pad (standard base64, replace `+`→`-`, `/`→`_`, strip `=` padding)
   - Prepend multibase prefix `'m'` (RFC 4648 table: `m` = base64url multibase)
   - Returns plain string (not `Result` — pure computation, cannot fail)

   **`multibaseBase64UrlDecode(encoded: string): Result<Uint8Array>`**
   - Validate first character is `'m'`; fail with context if not
   - Decode body as base64url-no-pad
   - Fail with context if body is malformed

   **`exportPublicKeyAsMultibaseSpki(key: CryptoKey): Promise<Result<string>>`**
   - Validate `key.type === 'public'`; fail if not
   - `globalThis.crypto.subtle.exportKey('spki', key)` → `ArrayBuffer`
   - `multibaseBase64UrlEncode(new Uint8Array(buf))` → return

   **`importPublicKeyFromMultibaseSpki(encoded: string, algorithm: KeyPairAlgorithm): Promise<Result<CryptoKey>>`**
   - `multibaseBase64UrlDecode(encoded)` → bytes (fail fast)
   - Look up `keyPairAlgorithmParams[algorithm]`
   - `globalThis.crypto.subtle.importKey('spki', bytes, params.importPublicKey as AlgorithmIdentifier, true, [...params.publicKeyUsages])`
   - Wrap in `captureAsyncResult`; add `.withErrorFormat` context

2. Export all four from `index.ts` and `index.browser.ts`.

3. Tests in `ts-extras/src/test/unit/crypto/spkiHelpers.test.ts`:
   - Round-trip (`export → import`) for each algorithm: Ed25519, X25519, ECDH-P256, ECDSA-P256, RSA-OAEP-2048
   - `multibaseBase64UrlEncode` / `multibaseBase64UrlDecode` inverse
   - Negative: bad multibase prefix → `multibaseBase64UrlDecode` fails
   - Negative: malformed base64url body → decode fails
   - Negative: SPKI bytes of wrong algorithm passed to `importPublicKeyFromMultibaseSpki` → fail
   - Negative: non-public key passed to `exportPublicKeyAsMultibaseSpki` → fail

4. Checkpoint: update `state.md`.

### Phase 3 — Item 2: RFC 8785 canonicalization

1. Read `hashingNormalizer.ts` and `base/normalize.ts` in full.

2. Add `canonicalize(value: JsonValue): string` to `HashingNormalizer`.  
   **Preferred attachment point:** `HashingNormalizer`. If this feels wrong (non-hashing method on a hashing class), move it to `Normalizer` in `base/normalize.ts` — use your judgment and document your choice in `state.md`.

3. Implementation contract:
   - Walk `value` recursively
   - **For objects:** sort keys with `String(k1) < String(k2)` comparison (same logic as `_compareKeys`) then emit directly to string — do NOT construct a new JS object (JS engines numerically reorder integer-string keys `"0"`, `"1"`, `"10"` in object literals)
   - **For arrays:** emit elements in order
   - **For strings:** emit as JSON-encoded string (via `JSON.stringify(s)`)
   - **For numbers:** emit via `JSON.stringify(n)` — standard JS double-precision serialization; document in JSDoc that arbitrary-precision edge cases beyond IEEE 754 double are not covered
   - **For `null`, `boolean`:** emit directly (`"null"`, `"true"`, `"false"`)
   - Returns a valid JSON string; byte-identical outputs for byte-identical inputs

4. Add JSDoc on the method: state RFC 8785 compliance scope (key ordering, direct emission bypass), note the number precision boundary.

5. Tests in `ts-utils/src/test/unit/hash.test.ts`:
   - Object with mixed string + integer-string keys `{ "10": 1, "2": 2, "abc": 3 }` → output has keys in lexicographic order (`"10"`, `"2"`, `"abc"`), NOT numeric order (`"2"`, `"10"`, `"abc"`)
   - Round-trip: `JSON.parse(canonicalize(value))` produces equivalent value (mod key order)
   - Byte-identical: same input → same output string on repeated calls
   - Nested objects and arrays: verify recursive ordering
   - Existing `HashingNormalizer` tests continue to pass unchanged

6. Checkpoint: update `state.md`.

### Phase 4 — Item 4: LIBRARY_CAPABILITIES.md update

1. Read `.ai/instructions/LIBRARY_CAPABILITIES.md` in full.

2. In the `@fgv/ts-extras` section (under `crypto-utils` packlet), expand the description to cover:
   - `ICryptoProvider` interface with key operations enumerated
   - `KeyStore` — password-protected vault; call out `addSecretFromPassword` / `verifySecretFromPassword` explicitly as **the** answer for password hashing (anti-reimplementation guard)
   - The new `exportPublicKeyAsMultibaseSpki` / `importPublicKeyFromMultibaseSpki` / `multibaseBase64UrlEncode` / `multibaseBase64UrlDecode` helpers
   - The new `'x25519'` entry in `KeyPairAlgorithm`

3. In the Decision shortcuts section (bottom of file), add or extend:
   - "Need to hash / verify a password?" → `KeyStore.addSecretFromPassword` / `verifySecretFromPassword` from `@fgv/ts-extras/crypto-utils`. Never roll PBKDF2 directly.
   - "Need stable canonical JSON (RFC 8785)?" → `canonicalize()` from `@fgv/ts-utils` hash packlet
   - "Need to encode/decode a public key as multibase SPKI?" → `exportPublicKeyAsMultibaseSpki` / `importPublicKeyFromMultibaseSpki` from `@fgv/ts-extras/crypto-utils`
   - "Need X25519 key agreement?" → `generateKeyPair('x25519', ...)` from `ICryptoProvider`

4. Checkpoint: update `state.md`.

---

## Acceptance criteria

- [ ] All four items implemented per spec
- [ ] `rushx build` passes in `ts-extras`, `ts-web-extras`, `ts-utils`
- [ ] `rushx test` passes in all three libraries (100% coverage)
- [ ] No `any` types; all fallible operations return `Result<T>`
- [ ] New exports visible in `index.ts` / `index.browser.ts` for `ts-extras`
- [ ] `LIBRARY_CAPABILITIES.md` sections added/updated per spec
- [ ] PR opened to `release` from `claude/auth-primitives-batch1`

---

## Exit artifact (state.md)

Update `state.md` at each phase checkpoint and finally with:
- Phases completed
- PR number
- Any implementation decisions that differed from this brief (e.g., canonicalize attachment point)
- Test coverage status per library
- Any open questions or blockers surfaced during implementation

---

## Resume protocol

If the session ends before completion: read `brief.md` (this file) and `state.md` to resume. `state.md` records which phases are done and any decisions made.
