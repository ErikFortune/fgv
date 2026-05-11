# auth-primitives-batch1 — completed

**Stream ID:** auth-primitives-batch1
**Bucket:** 2026-05
**PR:** [#322](https://github.com/ErikFortune/fgv/pull/322) — `feat(auth-primitives-batch1): X25519 keypair, SPKI helpers, RFC 8785 canonicalize`
**Merge commit:** `bb913392`
**Published in:** `5.1.0-26` (alpha, prerelease)
**Cross-repo consumer:** [`ErikFortune/personaility`](https://github.com/ErikFortune/personaility) — `claude/auth-primitives-foundation-h34cG`

## What shipped

Four targeted primitives needed by personaility's `auth-primitives-foundation` workstream:

1. **X25519 keypair** — `'x25519'` added to `KeyPairAlgorithm` union and to `keyPairAlgorithmParams`. Both `NodeCryptoProvider` and `BrowserCryptoProvider` are fully table-driven and picked it up without provider-side changes. Usages: `deriveKey`, `deriveBits`. Public-key usages empty (Curve25519 Montgomery form, key-agreement only).
2. **RFC 8785 canonicalization** — `canonicalize(value: JsonValue): string` on the base `Normalizer` (not `HashingNormalizer` — see decisions). Recursive descent emitting directly to string to avoid JS engines reordering integer-string keys (`"0"`, `"1"`, `"10"`).
3. **Multibase/SPKI helpers** in `@fgv/ts-extras/crypto-utils`:
   - `multibaseBase64UrlEncode(data)` / `multibaseBase64UrlDecode(encoded)`
   - `exportPublicKeyAsMultibaseSpki(key)` / `importPublicKeyFromMultibaseSpki(encoded, algorithm)`
   - All four exported from `index.ts` and `index.browser.ts`.
4. **`LIBRARY_CAPABILITIES.md`** — crypto-utils and hash sections expanded; decision shortcuts added for password hashing, canonical JSON, multibase SPKI, and X25519 key agreement.

## Package surface (as shipped)

- `@fgv/ts-extras/crypto-utils` — `model.ts`, `keyPairAlgorithmParams.ts`, `nodeCryptoProvider.ts`, new `spkiHelpers.ts`, both `index*.ts`
- `@fgv/ts-web-extras/crypto-utils` — `browserCryptoProvider.ts` (X25519 picked up table-driven; new keypair test file)
- `@fgv/ts-utils/base/normalize.ts` — `canonicalize()` added to base `Normalizer`
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — new file

## Key decisions

- **`canonicalize()` lives on base `Normalizer`, not `HashingNormalizer`.** Moved per orchestrator code review (#322 review `r3214578687`): `canonicalize` uses none of the hashing functionality, so attaching it to the hashing subclass was off-kilter. The base location makes it available to `Crc32Normalizer` and any future subclass.
- **Direct string emission, not JS object reconstruction.** Required to prevent JS engines from numerically reordering integer-string keys in object literals (`{"10": ..., "2": ...}` would silently reorder `"2"` before `"10"` if reconstructed as a literal).
- **`spkiHelpers.ts` as standalone module exports, not interface methods.** `ICryptoProvider` was deliberately left untouched — these helpers are cross-runtime utilities, not provider operations.
- **`btoa`/`atob` for base64 in `spkiHelpers`.** Both runtimes have it (Node 16+ and all modern browsers); avoids dragging Buffer into browser entry points. `NodeCryptoProvider` keeps its Buffer-based base64 for its own methods because it's Node-only.

## Acceptance status

- [x] All four items implemented per spec
- [x] `rushx build` passes in `ts-extras`, `ts-web-extras`, `ts-utils`
- [x] `rushx test` passes in all three libraries (100% coverage)
- [x] No `any` types; all fallible operations return `Result<T>`
- [x] New exports visible in `index.ts` / `index.browser.ts` for `ts-extras`
- [x] `LIBRARY_CAPABILITIES.md` sections added/updated per spec
- [x] PR opened, reviewed, merged
- [x] Published in `5.1.0-26` alpha; consumer (personaility) unblocked

## Notes for sibling-sweep / future cleanup

- Minor: `importPublicKeyFromMultibaseSpki` early-returns on `isFailure()` instead of `.onSuccess`-chaining the sync→async transition. Intentional for sync→async readability; not blocking, but a candidate to revisit if a clean `Result`-to-`AsyncResult` bridge pattern emerges.
- This stream landed under the inherited (pre-substrate-fit) substrate — it predates the explicit "package surface" stream-entry convention. Future streams should declare package surface up front in WORKSTREAMS.md.

## Bookkeeping note

Artifact migration to `completed/` and the polished README (this file) were done **post-merge**, not pre-merge as the artifact-protocol convention requires. Cause: the implementing orchestrator was execution-focused and the post-merge bookkeeping pass slipped. Captured here as the first observed instance under the new substrate; flagged to the orchestrator for the lessons-codification triage.

## Source artifacts

- [`brief.md`](./brief.md) — original kickoff brief (orchestrator-authored)
- [`state.md`](./state.md) — implementing-agent terminal state
