# auth-primitives-batch1 — completed

**Stream ID:** auth-primitives-batch1
**Bucket:** 2026-05
**PR:** [#322](https://github.com/ErikFortune/fgv/pull/322) — `feat(auth-primitives-batch1): X25519 keypair, SPKI helpers, RFC 8785 canonicalize`
**Merge commit:** `bb913392`
**Published in:** `5.1.0-26` (alpha, prerelease)
**Cross-repo consumer:** [`ErikFortune/personaility`](https://github.com/ErikFortune/personaility) — `claude/auth-primitives-foundation-h34cG`

> **Amended 2026-08-14.** Four statements in this file were wrong. They are corrected in
> place below and the original wording is preserved verbatim in
> [Appendix A](#appendix-a--corrections-2026-08-14), with what was wrong and how it was
> verified. See also `meta.yaml` in this directory.

## What shipped

Four targeted primitives needed by personaility's `auth-primitives-foundation` workstream:

1. **X25519 keypair** — `'x25519'` added to `KeyPairAlgorithm` union and to `keyPairAlgorithmParams`. Both `NodeCryptoProvider` and `BrowserCryptoProvider` are fully table-driven and picked it up without provider-side changes. Usages: `deriveKey`, `deriveBits`. Public-key usages empty (Curve25519 Montgomery form, key-agreement only).
2. **RFC 8785 canonicalization** — `canonicalize(from: unknown): Result<string>` on the base `Normalizer` (not `HashingNormalizer` — see decisions). Recursive descent emitting directly to string to avoid JS engines reordering integer-string keys (`"0"`, `"1"`, `"10"`). The brief specified `(value: JsonValue): string`; the shipped signature takes `unknown` and returns a `Result` because a non-serializable input (`Symbol`, `Date`, `Map`, `NaN`) is a real failure mode, which the tests assert.
3. **Multibase/SPKI helpers** in `@fgv/ts-extras/crypto-utils`:
   - `multibaseBase64UrlEncode(data)` / `multibaseBase64UrlDecode(encoded)`
   - `exportPublicKeyAsMultibaseSpki(key, provider)` / `importPublicKeyFromMultibaseSpki(encoded, algorithm, provider)`
   - All four exported from `index.ts` and `index.browser.ts`.
4. **`LIBRARY_CAPABILITIES.md`** — crypto-utils and hash sections expanded; decision shortcuts added for password hashing, canonical JSON, multibase SPKI, and X25519 key agreement.

## Package surface (as shipped)

- `@fgv/ts-extras/crypto-utils` — `model.ts` (**two new `ICryptoProvider` methods** — see decisions), `keyPairAlgorithmParams.ts`, `nodeCryptoProvider.ts`, new `spkiHelpers.ts`, both `index*.ts`
- `@fgv/ts-web-extras/crypto-utils` — `browserCryptoProvider.ts` (X25519 picked up table-driven; **`exportPublicKeySpki` / `importPublicKeySpki` implemented**; new keypair test file)
- `@fgv/ts-utils/base/normalize.ts` — `canonicalize()` added to base `Normalizer`
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — **moved here** from `.agents/LIBRARY_CAPABILITIES.md` (the file dates to [#312](https://github.com/ErikFortune/fgv/pull/312), `852033274`) and its crypto-utils and hash sections expanded. The move was not clean: the `.agents/` copy survived until [#510](https://github.com/ErikFortune/fgv/pull/510) removed the deprecated tree, so two copies coexisted in between.

## Key decisions

- **`canonicalize()` lives on base `Normalizer`, not `HashingNormalizer`.** Moved per orchestrator code review (#322 review `r3214578687`): `canonicalize` uses none of the hashing functionality, so attaching it to the hashing subclass was off-kilter. The base location makes it available to `Crc32Normalizer` and any future subclass. The brief named `HashingNormalizer` as preferred but pre-authorized this judgment call.
- **Direct string emission, not JS object reconstruction.** Required to prevent JS engines from numerically reordering integer-string keys in object literals (`{"10": ..., "2": ...}` would silently reorder `"2"` before `"10"` if reconstructed as a literal).
- **`spkiHelpers.ts` as standalone module exports, not interface methods — but `ICryptoProvider` did gain two methods, against the brief.** The helpers themselves are module-level functions, as briefed. However, routing them through the provider (so they work cross-runtime) required adding `exportPublicKeySpki` and `importPublicKeySpki` to `ICryptoProvider`, implemented in both providers. `brief.md:52` put this out of scope **unconditionally** — "no new methods (standalone helpers only, not interface methods)" — with no judgment-call clause of the kind it granted for the `canonicalize` attachment point. The change was requested at orchestrator review and looks right on the merits; what was wrong was recording it as if the boundary had been respected. Both methods are documented in `LIBRARY_CAPABILITIES.md`.
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
- [ ] **Not met, discovered 2026-08-14:** the brief's `ICryptoProvider`-is-out-of-scope constraint (see decisions)

## Notes for sibling-sweep / future cleanup

- **Now tracked in `docs/TECH_DEBT.md` (P3), 2026-08-14.** `importPublicKeyFromMultibaseSpki` early-returns on `isFailure()` instead of `.onSuccess`-chaining the sync→async transition. This was deferred "if a clean `Result`-to-`AsyncResult` bridge pattern emerges" — that pattern has since shipped (`AsyncResult` with `thenOnSuccess` / `thenOnFailure` in `@fgv/ts-utils`, documented in `CODING_STANDARDS.md` § "Async Result Chaining"), so the precondition is met and the item is live. It sat unrecorded for three months because a deferral written only into a completed stream's README has no reader at the moment its trigger fires.
- This stream landed under the inherited (pre-substrate-fit) substrate — it predates the explicit "package surface" stream-entry convention. Future streams should declare package surface up front in WORKSTREAMS.md.

## Bookkeeping note

Artifact migration to `completed/` and the polished README (this file) were done **post-merge**, not pre-merge as the artifact-protocol convention requires. Cause: the implementing orchestrator was execution-focused and the post-merge bookkeeping pass slipped. Captured here as the first observed instance under the new substrate; flagged to the orchestrator for the lessons-codification triage.

*(2026-08-14: it recurred repeatedly after this, including on the `ai-assist-client-tools` cluster close where the codified rule existed and the checklist gate failed to catch it. That history is what motivated the `finalize-task` skill, which produced this amendment.)*

## Source artifacts

- [`brief.md`](./brief.md) — original kickoff brief (orchestrator-authored)
- [`state.md`](./state.md) — implementing-agent terminal state
- [`meta.yaml`](./meta.yaml) — structured record (added 2026-08-14)

---

## Appendix A — corrections (2026-08-14)

Produced by a `/finalize-task retroactive` run whose antagonist pass commissioned an
independent reviewer against this stream's artifacts and the shipped source. The original
wording is preserved verbatim so the amendment can be audited rather than trusted.

**Why amend rather than annotate.** `brief.md` and `state.md` are authored-in-flight
records and are left untouched — they are evidence of what was known at the time. This
README is a synthesized summary written after the fact, and future agents read it as a
statement of what shipped. A synthesis that is wrong about its own subject is a hazard,
not a historical record.

### A.1 — `ICryptoProvider` was described as untouched; it gained two methods

> **Original (Key decisions):** "**`spkiHelpers.ts` as standalone module exports, not
> interface methods.** `ICryptoProvider` was deliberately left untouched — these helpers
> are cross-runtime utilities, not provider operations."

Wrong on the load-bearing clause. `ICryptoProvider` gained `exportPublicKeySpki` and
`importPublicKeySpki`, both implemented in `NodeCryptoProvider` and
`BrowserCryptoProvider`. Verified by `git show bb9133920^:libraries/ts-extras/src/packlets/crypto-utils/model.ts`
(zero occurrences) against `git show bb9133920:...` (both present). `brief.md:52` forbade
exactly this without exception.

### A.2 — `LIBRARY_CAPABILITIES.md` was described as a new file

> **Original (Package surface):** "`.ai/instructions/LIBRARY_CAPABILITIES.md` — new file"

It was a move, not a creation. `git log --follow` traces the file to #312 (`852033274`,
2026-05-02) at `.agents/LIBRARY_CAPABILITIES.md`; #322's own commit message says "Move
`LIBRARY_CAPABILITIES.md` from `.agents/` to `.ai/instructions/`". A first pass at
`meta.yaml` repeated this error, having verified with `git log --diff-filter=A` *without*
`--follow` — which sees only a file's first appearance at its current path and therefore
reports every path move as a creation.

### A.3 — the SPKI helper signatures omitted the `provider` argument

> **Original (What shipped, item 3):** "`exportPublicKeyAsMultibaseSpki(key)` /
> `importPublicKeyFromMultibaseSpki(encoded, algorithm)`"

Both take a third `provider: ICryptoProvider` argument. This was stale **at merge**, not
overtaken later — the blob at `bb9133920` already carries the three-argument signatures,
so this README reproduced the brief's pre-revision shapes rather than the code it was
documenting. `LIBRARY_CAPABILITIES.md` recorded the correct signatures at the time.

### A.4 — the `canonicalize` signature was quoted from the brief, not from the code

> **Original (What shipped, item 2):** "`canonicalize(value: JsonValue): string` on the
> base `Normalizer`"

Shipped as `canonicalize(from: unknown): Result<string>`. The change is correct per the
repo's own standards — a fallible operation returns `Result<T>`, and the test suite
asserts `.toFail()` for `Symbol`, `Date`, `Map` and `NaN` — but it is a divergence from
the brief's literal contract that no artifact recorded.

### Checked and unchanged

Verified and found accurate, listed so a reader knows the scope of this pass: the X25519
"no provider-side changes" claim (neither provider file contains the string `x25519`); the
direct-string-emission implementation claim (`_canonicalizeRfc8785` concatenates via
`.map().join(',')` and builds no intermediate object); the PR number, merge commit and
published alpha version; and the `WORKSTREAMS.md` ledger entry, which describes the
`LIBRARY_CAPABILITIES.md` change correctly as sections added and never claimed a file
creation. One claim could not be settled either way: `state.md`'s assertion that Phase 1's
X25519 work was already present on the branch before the implementing agent started. The
PR was squash-merged and the pre-squash commits are unreachable, while the squashed commit
message narrates Phase 1 in first-person implementation terms. Recorded as unresolved
rather than accepted or rejected.
