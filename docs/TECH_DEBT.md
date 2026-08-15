# Tech Debt — fgv

Already-shipped imperfections. Priority-ranked; addressed
opportunistically when the right surface area is touched.

---

## Disposition pass — 2026-08-14

Every entry was verified against current source. **Four retired, ten kept, four of those
rewritten.** The ledger went from 14 entries to 10.

**Retired** (evidence in git history; nothing carried forward):
`IProvenance.derivedFrom` bare-id ambiguity (all three sub-resolutions shipped — the entry was
pure history and longer than any live item) · `ts-web-extras` lint cleanup (`eslint src` now
exits **0**, not the recorded 126 violations) · `"sideEffects": false` convention (already stated
in `MONOREPO_GUIDE.md`; audit of all 25 libraries found one real miss, filed as a chore rather
than standing debt) · `apiClient.ts` at the `max-lines` cap (#620 split it; the only durable
lesson was already codified verbatim in `CODING_STANDARDS.md`).

### Four triggers have already fired without anyone acting

This is the finding worth acting on, and it is the same failure the recent artifact sweep found
everywhere else: **a trigger phrased as "next time someone touches X" depends on a person
recalling a ledger entry at the moment they are busy with something else.** These four fired and
nobody noticed:

| entry | trigger | what actually happened |
|---|---|---|
| `ts-prompt-assist` TSDoc | "once the v0.1 surface is stable" | v0.1 shipped; two features were built on top of it |
| cross-runtime export parity | "anytime an `index.browser.ts` is touched" | `ts-web-extras` took three export-adding features; **9 of 10 packages still untested** |
| `createMemoryTools` codec duplication | "when the temporal write path lands" | it landed, with tests |
| `AsyncDeferredResult` invoker | "the third consumer" | there are now **four** |

The cross-runtime one is the instructive case: its trigger has fired at least three times, so the
fix is not to restate it but to **replace recall with a mechanical gate** — see that entry.

---

## Priority key

- **P1** — blocking / structural; address before resuming major feature work.
- **P2** — fix before the next major feature in the affected area.
- **P3** — opportunistic cleanup.
- **P4** — doc / minor consistency.

## Entry format

```markdown
- **[Pn] Title.**
  Description with file pointers.

  **Trigger**: when this should be addressed.

  **Scope sketch**: one-paragraph fix shape.

  **Not a P(n+1)**: why this priority and not lower.

  **Reference**: PR / commit / session context that surfaced it.
```

---

## P1 — Blocking

*(none currently outstanding — the `ts-prompt-assist` validator-chain caller-controlled `T` cluster was fully retired by the surface-tidy round, which split `resolveAndValidateOutput<T>` into `resolveJsonOutput<K>` + `resolveFreeTextOutput` and replaced the remaining caller-asserted-`T` boundary with a runtime-evidenced kind check.)*

## P2 — Fix before next major feature in affected area

- **[P2] `fileTreeMemoryStore.ts` is 9 lines under the 2000-line `max-lines` cap.**
  1991 lines as of `vector-rebuild-report-by-kind` (2026-08-15), which spent its own headroom: the
  `asRecordSource()` filter-and-tally had to be extracted to
  `libraries/ts-agent-memory/src/packlets/store/vectorRecordSource.ts` purely to get back under the
  cap. In this repo a `max-lines` warning is a **CI failure** — `rush rebuild` exits non-zero on
  "SUCCESS WITH WARNINGS" while a per-project `rushx build` exits 0 — so the next feature that adds
  a dozen lines to this file turns a green local build into a red PR.

  This file has been here before. `CODING_STANDARDS.md` § "A local warning is a CI failure" is
  written from *this exact file* crossing the cap on the PersonAIlity Stream A stack. There is no
  standing entry for it because the only max-lines entry the ledger carried was `apiClient.ts`,
  retired 2026-08-14 when #620 split it.

  **Trigger**: the next stream that adds a public member, a create param, or a write-path branch to
  `FileTreeMemoryStore` — i.e. almost any `ts-agent-memory` feature. Do the split first, not after
  the red check.

  **Scope sketch**: the collaborator-extraction pattern already used twice on this file is the
  answer — `VectorMaintenance` (#…, `agent-memory-store-vector-slice`) and now
  `vectorRecordSource`. The next candidates are the temporal projection helpers (`_projectAsOf` and
  friends) and the observation fan-out, both of which are self-contained and take the store
  structurally rather than importing it. Neither is a public-surface change, so both ship as
  `"type": "none"`.

  **Not a P3**: P3 is opportunistic, and 9 lines of headroom means the trigger is not "if someone
  touches this" but "the next time anyone does". The failure mode is also invisible locally, which
  is what makes it cost a review cycle rather than a minute.

  **Reference**: `vector-rebuild-report-by-kind` (2026-08-15) — its `result.md` records the
  extraction as a deviation from its brief and states plainly that it bought ~9 lines, not a
  solution.

- **[P2] `ts-prompt-assist` needs a *member-level* TSDoc pass — 66 undocumented members, plus one thrice-repeated inline union.**
  **Re-scoped 2026-08-14. The top-level half of this entry is DONE and the original framing is now
  misleading.** Measured against `etc/ts-prompt-assist.api.md`: **135 of 135 top-level exported
  symbols carry TSDoc; zero undocumented.** What remains is **66 `(undocumented)` markers on
  interface and class *members*** — concentrated in `IPromptSlot` (5), `IChainWalkResult` (4),
  `IPromptStoreFixtureSeedRecord` (4), `IResourceSlotBinding` (4), `ISafeguardFinding` (4),
  `IStoredPromptRecord` (4), then a tail of threes.

  The named anti-pattern also still stands: `Qualifiers.IReadOnlyQualifierCollector | ReadonlyArray<string | Qualifiers.IQualifierDecl>`
  is spelled inline **three times** in `resolve/promptLibrary.ts` (`:90`, `:1342`, `:1362`) with no
  named type to attach docs to.

  That makes this a bounded, gradeable task rather than the open-ended audit it was written as —
  which is the main reason it has sat: "audit TSDoc presence and quality" has no finish line, and
  "close 66 markers and extract one union" does.

  *Original framing, superseded: it described the surface as carrying "minimal TSDoc" on methods,
  parameters and return shapes. True in 2026-06; not true now.*

  PR #380 review surfaced that the recently-extended `ts-prompt-assist` surface — `PromptLibrary` + `IPromptLibraryCreateParams` + `IPromptResolveRequest` + the related fixture / resource-binding / resolve-output types — carries minimal TSDoc on individual methods, parameters, and return shapes. The v0.1 surface has been moving fast (Phase B sub-phases + post-merge cleanups + surface-tidy + round-1 ergonomics absorption), so documenting heavily during churn was the right call; with v0.1 effectively settled now, the next concern is consumer-facing TSDoc quality on the public surface.

  A related pattern Erik flagged in the same PR #380 review: **inline anonymous types + union types should be extracted to named `type` / `interface` declarations** so they have a single place to attach TSDoc. The library currently has a few patterns like `qualifiers: IReadOnlyQualifierCollector | ReadonlyArray<TAxes | (IQualifierDecl & { readonly name: TAxes })>` that would benefit from a named extracted type.

  **Trigger — FIRED.** The stated trigger was "post-round-2 pressure-test, once the surface is
  stable". v0.1 shipped, `LIBRARY_CAPABILITIES.md` documents it as settled, and both
  `HorizontalComposer` and the observation store have since been built *on top of* it. The
  surface is stable; the wait is over. Re-triggered on: just do it, or the next substantive
  change to the packlet.

  **Scope sketch**: commission a documentation-pass agent against `@fgv/ts-prompt-assist`'s public surface (and any new `@fgv/ts-res` qualifier surface from PR B). For each exported type / class / method:
  - Audit TSDoc presence + quality (does it answer "why" not just "what"; do `@public` symbols have useful `@remarks`).
  - Extract inline anonymous types + unions to named declarations where extraction creates a meaningful single-attach-point for documentation.
  - Cross-link related types via `{@link}` directives.
  - Run api-extractor; verify all `// @public` types have non-`(undocumented)` flags.

  Compare quality bar to `@fgv/ts-utils`'s base packlet, which is the reference for documentation depth.

  **Not a P3**: the surface is public alpha-stage and being consumed; opaque type signatures degrade the consumer-port experience materially. P2 trigger ("post-round-2 stable") puts it on a natural cadence.

  **Not a P1**: no functional gap; the surface works; this is documentation polish on shipped code.

  **Reference**: PR #380 (round-1 ergonomics PR C) — Erik's review surfaced both the doc gap and the inline-types pattern. Cluster spans `libraries/ts-prompt-assist` + the `ts-res` qualifier collector surface PR B extended.

- **[P2] Cross-runtime entry-point export parity is not systematically tested.**
  Libraries with both Node (`src/index.ts`) and browser (`src/index.browser.ts`) entry points can drift in export names without CI catching it. api-extractor runs only on the Node entry point, so a typo or rename in the browser entry slips through. Pattern has bitten the team three times: `@fgv/ts-extras` exported `Crypto` instead of `CryptoUtils` (personaility web app); `@fgv/ts-extras` missed `Yaml` entirely (ts-prompt-assist sample app, fixed in #377); plus the earlier `repo-template` issue. **`@fgv/ts-extras` now has the recommended micro-test** (`src/test/unit/index.browser.test.ts` asserts every top-level name in `index.ts` is also in `index.browser.ts`); other libraries with browser entries still need it.

  Comprehensive per-export coverage on every library is too expensive given the API surface. The right scope is opportunistic per-library micro-tests.

  **Libraries with `*.browser.ts` entries that still need the micro-test:** `ts-bcp47`, `ts-res`, `ts-web-extras`, `ts-app-shell`, `ts-res-ui-components`, `ts-json`, `ts-json-base`, `ts-sudoku-lib`, `ts-sudoku-ui`.

  **Trigger — FIRED repeatedly without effect; needs replacing, not restating (2026-08-14).**
  The stated trigger is "anytime one of those libraries' `index.browser.ts` is touched
  substantively". Verified today: **nine of the ten packages shipping an `index.browser.ts` still
  have no parity test** — `grep -rl "index.browser" --include=*.test.ts` returns three files, all
  in `ts-extras`. Meanwhile `ts-web-extras` alone has taken safer-fetch, `IdbPrivateKeyStorage`
  and the base64 `contentEncoding` work since this was written, every one of them export-adding,
  and still has none.

  A trigger that has fired three times unnoticed is not a trigger — it relies on an author
  remembering a ledger entry at the moment they are busy with something else. **Replace it with a
  mechanical gate**: fold the parity check into something CI already runs (the change-file gate is
  the natural host, since it already keys off "which packages did this branch touch"), so the
  question is asked by the machine rather than recalled by a person. That reframing is the actual
  work item now; the per-package micro-tests are the easy part.

  **Scope sketch**: copy the pattern from `@fgv/ts-extras/src/test/unit/index.browser.test.ts` — imports both `index.ts` and `index.browser.ts` directly via relative paths, asserts every top-level name exported from Node is also exported from browser. Browser may have additional names (e.g. back-compat aliases) but nothing Node ships may go missing on browser. Per-library cost: ~15 lines.

  **Not a P3**: the pattern has recurred multiple times across the team; the consumer-impact cost (production-visible undefined exports) is real. P2 trigger ("next time the browser entry is touched") puts it on a natural cadence.

  **Reference**: PR #377 (ts-extras Yaml fix + micro-test pattern landed); original L13 lessons-pending entry; earlier ts-extras `Crypto` bug.

## P3 — Opportunistic cleanup

- **[P3] `@fgv/ts-web-extras`'s safer-fetch suite cannot exercise a successful response — jsdom ships no Fetch globals.**
  `libraries/ts-web-extras/src/test/unit/browserSaferFetch.test.ts` drives only a *failing*
  scripted transport, because the jsdom test environment provides no `Response` constructor, so
  the suite cannot build one to return. Every success-path semantic on the browser entry points —
  the content-type gate firing on a real header set, the streaming size cap counting decoded
  bytes, body-guard dispatch, the shape of a returned `ISaferFetchResponse<T>` — is covered
  **solely** by the `@fgv/ts-extras` suite, on the shared runtime-agnostic core.

  That is *mostly* fine by construction: the core genuinely is shared verbatim, which is the
  design's whole premise. The gap is that the premise is untested on the browser side, so a
  browser-specific regression in the thin wrapper — an option not threaded, a guard not passed
  through — would not be caught by either suite.

  **Trigger**: next substantive change to the browser safer-fetch packlet, or whenever the test
  environment gains Fetch globals.

  **Scope sketch**: either point the browser package's jest environment at one that supplies
  `Response` (Node 20+ has it natively — `testEnvironment: 'node'` for this file alone, since it
  tests no DOM), or inject a minimal `Response` polyfill into the suite's setup. Then port the
  success-path cases from the `ts-extras` suite so the wrapper is exercised end to end.

  **Not a P2**: the shared core is well covered and the wrapper is thin; this is a coverage-shape
  gap rather than a known defect. It earns an entry because it is a **security** primitive whose
  browser posture is already the weaker of the two — three guarantees are structurally absent
  there and stated rather than degraded — so the wrapper is exactly where a silent regression
  would be least visible and most costly.

  **Reference**: `safer-fetch-s3` (#601) `result.md` / `README.md`, which record the constraint;
  surfaced 2026-08-14 by the retroactive `finalize-task` sweep, which found it recorded in no
  durable ledger. Note `docs/TECH_DEBT.md` and `docs/FUTURE.md` contain no other safer-fetch
  entry at all.

- **[P3] `importPublicKeyFromMultibaseSpki` still early-returns instead of chaining; the bridge pattern it was waiting for has shipped.**
  `libraries/ts-extras/src/packlets/crypto-utils/spkiHelpers.ts` breaks its `Result` chain at the
  sync→async transition — `const decodeResult = multibaseBase64UrlDecode(encoded); if
  (decodeResult.isFailure()) { return fail(...); }` — rather than chaining into the awaited
  `provider.importPublicKeySpki(...)`. Its sibling `exportPublicKeyAsMultibaseSpki` chains cleanly, so
  the two read differently for no reason a caller can see.

  **Trigger**: fired already, and that is the point of this entry. The
  `auth-primitives-batch1` README deferred it explicitly — "a candidate to revisit if a clean
  `Result`-to-`AsyncResult` bridge pattern emerges" — and `AsyncResult` with `thenOnSuccess` /
  `thenOnFailure` has since shipped in `@fgv/ts-utils` and is documented in `CODING_STANDARDS.md`
  § "Async Result Chaining". Address on the next substantive change to `crypto-utils`.

  **Scope sketch**: `return multibaseBase64UrlDecode(encoded).thenOnSuccess(async (bytes) =>
  provider.importPublicKeySpki(bytes, algorithm)).withErrorFormat((e) =>
  `importPublicKeyFromMultibaseSpki: ${e}`)`. Behaviour-preserving; the existing tests should pass
  unchanged, which is the check that it was purely stylistic.

  **Not a P2**: it is a readability defect in a correct function, not a correctness or type-safety
  one. It earns an entry only because it was a *recorded deferral whose stated precondition is now
  met* — the class of debt that otherwise disappears, since a deferral living solely in a completed
  stream's README has no reader at the moment its trigger fires.

  **Reference**: `auth-primitives-batch1` (#322) "Notes for sibling-sweep / future cleanup"; surfaced
  2026-08-14 by the retroactive `finalize-task` antagonist pass over that stream.

- **[P3] `@fgv/ts-utils` should export a single-`AsyncDeferredResult` invoker; FOUR packages now carry a private copy.**
  **Recount 2026-08-14 — the entry said two; there are four, so its own trigger fired twice over.**
  Beyond the two named below, `@fgv/ts-extras` has `_capture<T>` in
  `safer-fetch/saferFetch.ts:223-224` (same body, different name) and `@fgv/ts-prompt-assist`
  inlines the flatten at `safeguards/safeguardEngine.ts:128` with a comment explaining it.
  `_invokeDeferred` is still unexported (`mapResultsAsync.ts:235`) and absent from
  `etc/ts-utils.api.md`.

  **This also retires the entry's own "why not done inline" reasoning**, which argued the carry
  was cheaper than widening one consumer's PR stack. That held for two copies inside one stack.
  It does not hold for four independent packages, two of which have nothing to do with agent
  memory — at that point the duplication is a repo-wide pattern and the export is the cheaper
  end state.

  Invoking one consumer-supplied `() => Promise<Result<T>>` and turning a synchronous throw or a rejection
  into a `Failure` requires `captureAsyncResult` plus a flatten (`.onSuccess((inner) => inner)`), because
  `captureAsyncResult` wraps the hook's own `Result` and yields `Result<Result<T>>`. `ts-utils` already has
  exactly this as `_invokeDeferred` in `mapResultsAsync.ts`, but it is `@internal` and unexported, so
  `@fgv/ts-agent-memory` (`inMemoryCosineIndex.ts`) and `@fgv/ts-agent-memory-sqlite-vec`
  (`sqliteVecVectorIndex.ts`) each define an identical private `invokeHook`.

  **Trigger — FIRED (twice). Re-triggered on:** the next time the async `Result` family is
  touched, or simply do it — this is a ~20-line additive export on `ts-utils` plus four deletions.

  **Scope sketch**: export the existing `_invokeDeferred` under a public name (`captureDeferredResult` reads
  naturally alongside `captureResult` / `captureAsyncResult`, and `AsyncDeferredResult<T>` is already
  exported), with tests + a change file, then delete both private copies. Purely additive on `ts-utils`.

  **Why not done inline**: `ts-utils` is a foundational, non-active-development surface and was outside the
  declared package scope of the PersonAIlity Stream A stack. Widening a four-PR stack a consumer is waiting
  on to add a public export to the repo's most-depended-on library is the wrong trade; three duplicated
  lines twice is the cheaper carry. Recorded rather than left as a silent copy-paste.

  **Reference**: PersonAIlity Stream A (#611, #614); Copilot round 1 on #611 finding 1.

- **[P3] `ai-assist` fence extraction mis-slices a fenced body that itself contains a triple backtick.**
  `FENCED_BLOCK` in `libraries/ts-extras/src/packlets/ai-assist/jsonResponse.ts` is a single lazy-body regex (`([\s\S]*?)` between an opening fence and the first following ` ``` `). When a model emits a fenced JSON block whose *body* contains a literal triple backtick — most plausibly inside a string value, e.g. ` ```json\n{"snippet": "``` foo ```"}\n``` ` — the lazy body stops at the inner backticks and `extractJsonText` hands `JSON.parse` a truncated candidate. Long-standing and **not introduced by the `ai-assist-fenced-json-diagnostics` stream**: that stream only renumbered the regex's capture groups (opening fence became group 1, body group 2, so a body offset can be mapped back to the original text), verified behaviour-preserving over a 6804-input fuzz. The new `classifyJsonParseFailure` degrades safely here — it reports `'unknown'` rather than compounding the mis-slice with a confident wrong verdict.

  **Reproduced 2026-08-14.** Input ` ```json\n{"snippet": "``` foo ```"}\n``` ` yields capture
  group 2 = `{"snippet": "`, which reaches `findBalancedJsonSubstring`, classifies as
  `'unclosed'`, and fails with: *"JSON structure opened but never closed (depth 1 at end of
  input) — response may have been truncated (check IAiCompletionResponse.truncated / raise
  maxTokens)"*.

  **That message is a confidently wrong verdict**, which sharpens this entry considerably. The
  original text claimed the failure is merely "loud (a parse failure), not silent" and credited
  `classifyJsonParseFailure` with degrading safely to `'unknown'`. Both are too generous: the
  consumer is told the response was truncated and to raise `maxTokens`, on a response the model
  formed correctly and that was never truncated. Acting on that advice cannot fix it. Being
  loudly wrong about the cause is worse than failing opaquely, and it is exactly the class of
  misdiagnosis `classifyJsonParseFailure` exists to prevent.

  **Trigger**: the next time fence extraction is touched, or the first consumer report of a
  fenced response with embedded backticks failing to parse — which will most likely arrive
  *described as a truncation problem*, because that is what the library told them.

  **Scope sketch**: harden the fence scan — prefer counting the opening run's backtick length and matching a closing run of at least that length at a line start (the CommonMark rule), instead of the current first-` ``` `-wins lazy match. Keep `extractJsonText`'s messages unchanged; `locateJsonCandidate` is already the single source of truth for the strip-wrappers step, so the change lands in one place and both the extractor and the classifier follow.

  **Not a P4**: it produces a wrong parse candidate, not just a cosmetic wart — a consumer sees a confusing `JSON.parse` failure on output the model actually formed correctly.

  **Reference**: `ai-assist-fenced-json-diagnostics` stream; code-reviewer pass on that diff (2026-07-31), P3 finding 3.

- **[P3] `ts-agent-memory` L2 `createMemoryTools` duplicates the store's codec wiring instead of delegating.**
  `createMemoryTools({ codecs?, defaultCodec? })` (`libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts`) accepts the per-kind identity codecs a second time, in addition to `FileTreeMemoryStore.create({ codecs })`. `memory_write` needs them because `IMemoryStore.put` (`fileTreeMemoryStore.ts:496-502`) validates `envelope.id === codec-derived idStem` and does not derive/stamp the id itself — so a caller building a new `IMemoryRecord` must compute the same `idStem` up front, which requires the same codec the store was constructed with. The testbed scenario passes the same `codecs` map to both constructors, illustrating the drift risk: a host that re-wires the store's codecs but forgets the mirrored `createMemoryTools` config gets a confusing "envelope id does not match codec-derived stem" failure at `put()` time. Scope isolation is NOT compromised (codec `scope` is derived deterministically from `kind`, not from agent input; a mismatch loudly rejects the write rather than writing cross-scope), so this is a DX/robustness smell, not a security gap.

  **Trigger — ALREADY FIRED, unnoticed (2026-08-14).** The stated trigger was "when the temporal
  write path lands". It landed: `TemporalVersionedPolicy` is in `packlets/types/writePolicy.ts`
  and wired in `fileTreeMemoryStore.ts`, with `test/unit/store/temporalStore.test.ts` alongside.
  Nobody acted. Re-triggered on: the next time `createMemoryTools` is extended, or the next
  substantive change to the store's write path.

  **Scope sketch — now cheaper than when written.** Add an additive method to `IMemoryStore` —
  `resolveWriteAddress(kind, entityId): Result<IIdentityCodecResult>` delegating to the store's
  already-configured `codecs`/`defaultCodec` — and have `memory_write` call it, dropping the
  `codecs?`/`defaultCodec?` params from `ICreateMemoryToolsParams`.

  When this was written that was a novel shape. It is not any more: `IMemoryStore.dedupScopeFor(kind)`
  and `embedsKind(kind)` both shipped since, and both are exactly this pattern — a total,
  synchronous, store-owned accessor existing so that two code paths cannot disagree about a
  store-owned fact. `dedupScopeFor`'s own docstring makes the argument. So the proposal is now a
  third sibling of two shipped accessors rather than a new idea, and it should be scoped as such.

  **Reference**: `agent-memory-l2-tools` stream; code-reviewer pass on the L2 diff (2026-07-07).

- **[P3] ai-assist model-alias layer does NOT cover capability-detection or the typed `*ModelNames` unions — both stay manual on a provider line rotation.**
  The `@<provider>:<role>` alias layer (`ai-assist-model-aliases` stream) fixes model *selection/default* churn: a line rotation is one edit to a descriptor's `aliases` map plus a testbed run. It deliberately does **not** touch two adjacent axes, which still need a manual bump (design §3):

  1. **The capability-detection `idPattern` rules** (`libraries/ts-extras/src/packlets/ai-assist/registry.ts`, the `DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider` block). These classify the concrete ids a provider's `listModels` endpoint returns (never aliases). When a new line ships (e.g. `gemini-4.x`), the rules need a matching `idPattern` sibling — without it, new ids fall to the base capability set and are mis-classified (e.g. a thinking-capable model detected as non-thinking). Tier 2 added `/^gemini-3/ → ['chat','tools','vision','thinking']`; the next line needs the same hand-edit.
  2. **The typed `*ModelNames` unions** (`model.ts` — `GeminiThinkingModelNames`, `GeminiFlashImageModelNames`, the parallel `OpenAiThinkingModelNames`, etc.) used by the layered-options `models?` filter arrays. They enumerate concrete ids for compile-time ergonomics and must track real ids on a deprecation. Tier 2 bumped the Gemini unions to the 3.x ids by hand.

  **Trigger**: any future provider line rotation (Google/OpenAI/etc.), or when a `listModels` mis-classification or a stale `models?` filter id surfaces.

  **Scope sketch**: per rotation, add/adjust the provider's `idPattern` rule(s) and bump the corresponding `*ModelNames` union(s) alongside the one-line `aliases` map edit. A follow-on could additively allow aliases inside the `models?` arrays (so the unions stop enumerating concrete ids), but that is a separate design — out of the alias stream's scope.

  **Not a P2**: no shipped-behavior regression; the alias layer's value is precisely bounded and the doc (`LIBRARY_CAPABILITIES.md`, packlet README) states the boundary explicitly. This entry exists so the two manual axes are not forgotten on the next rotation.

  **Reference**: `ai-assist-model-aliases` design §3 + Tier 2 manual-axis bumps (`.ai/tasks/completed/2026-06/ai-assist-model-aliases/state.md`).

- **[P3] The capability resolvers in `ai-assist/registry.ts` return `| undefined` instead of `Result<T>`, and `undefined` is now three-ways ambiguous.**
  **Two functions, not one** (the original entry named only the first, and its line reference was
  stale): `resolveImageCapability` at `registry.ts:428-433` → `IAiImageModelCapability | undefined`,
  and `resolveEmbeddingCapability` at `registry.ts:469-474` → `IAiEmbeddingModelCapability | undefined`.
  Both delegate to the same private `resolveCapabilityForModel`, so the fix is one shared helper
  plus two public wrappers.

  **The case is stronger than "non-idiomatic" now.** When the alias layer landed, these gained a
  third failure mode, so `undefined` collapses three distinct outcomes: no capability rule matched
  the model; the provider declares no capabilities of that modality at all; or **`modelId` was an
  unresolvable or cyclic `@alias`** — a real error, flattened into "not found". The docstrings at
  `:418-419` and `:465-466` acknowledge the alias case explicitly, which means the code already
  knows a distinction it has no way to return.

  **Trigger**: next substantive change to the provider registry or capability resolution path.

  **Scope sketch**: change both return types to `Result<T>`; fail with a message that
  distinguishes the three cases (an unresolvable alias should not read as "model not found");
  update call sites to chain. Note the original sketch pointed at call sites "primarily in
  `apiClient.ts`" — **that file no longer exists**; the callers now live in
  `imageGenerationClient.ts` and `embeddingClient.ts`.

  **Not a P2**: callers currently handle `undefined` defensively, so behaviour is correct today.
  The ambiguity is a latent diagnostic failure, not a live bug.

  **Reference**: PR #329 review — pattern pre-existed the PR, absolved from that review.

## P4 — Doc / minor consistency

- **[P4] `mutableFsTree` `permission-denied for read-only file` test fails when the test container runs as root.**
  `@fgv/ts-json-base` `mutableFsTree` suite — one test expects `chmod`-based read-only enforcement to block a write. When the test container runs as root (the default in the cloud-agent harness), `chmod` is advisory; the kernel lets root write read-only files regardless. Reproduces on the `release` baseline; **not a regression** from any recent stream. Surfaced (and explicitly dispositioned as unrelated) during the `capture-async-result-upgrade` full-repo `rush test` sweep (PR #433).

  **Confirmed still failing, live, 2026-08-14.** Reproduced in this container (`id -u` → 0):
  `npx heft test --test-path-pattern mutableFsTree` fails on
  *`FsFileTreeAccessors › fileIsMutable › returns permission-denied for read-only file`*. Root
  cause verified directly — `fs.accessSync(<0o444 file>, W_OK)` **succeeds** as root, so
  `fsTree.ts:237` never throws and `:245` returns `succeedWithDetail(true, 'persistent')`. The
  test at `mutableFsTree.test.ts:83-94` is unguarded: no `process.getuid` check, no `.skip`.

  **Second symptom the entry missed, and the reason to raise this above pure cosmetics:**
  `fsTree.ts:246` carries `/* c8 ignore next 3 - unreachable when running as root (CI), tested in
  mutableFsTree.test.ts */`. That justification is **self-contradictory** — it excuses itself by
  pointing at the very test that cannot pass under the condition it names. So the debt has
  already leaked out of the test and into a coverage directive with a false rationale, which is
  the kind of thing a later reader will trust. Fix both in the same change.

  **Trigger**: opportunistic — next time the `mutableFsTree` test surface is open, or when CI logs become a meaningful nuisance.

  **Scope sketch**: gate the assertion on `process.getuid?.() !== 0` (skip the read-only-enforcement check under root); or rewrite the assertion to use a `FileTree` adapter capability check rather than relying on `chmod` semantics. Single-test scope; behavior of the production code is fine.

  **Not a P3**: no shipped-behavior impact and no functional regression; this is a sandbox-specific test-environment quirk.

  **Reference**: PR #433 (`capture-async-result-upgrade`) full-repo `rush test` sweep; reproduced on `release` baseline.

