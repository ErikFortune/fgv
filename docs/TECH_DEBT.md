# Tech Debt — fgv

Already-shipped imperfections. Priority-ranked; addressed
opportunistically when the right surface area is touched.

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

- **[P3] `@fgv/ts-agent-memory` `IProvenance.derivedFrom` carries the same latent bare-id ambiguity that scope-qualified edges just fixed.**
  The scoped-edge-targets change (`IEdge.target: MemoryId → IEdgeTarget`) made every attributed edge unambiguous across scopes, and threaded the same `(scope, id)` fix through backlinks, link traversal, the ingest cycle guard, and the ingest edge-validation path. `IProvenance.derivedFrom` (`libraries/ts-agent-memory/src/packlets/types/envelope.ts`) remains a bare `MemoryId` and shares the identical root cause: per-scope codecs (e.g. the MTM codec's `turn-<n>` stems) legally reuse a stem across scopes, so a bare `derivedFrom` id is ambiguous. It is **not dereferenced anywhere today** — the ingest pipeline only stamps it from `IIngestItem.sourceId` and never resolves it back to a record — so there is no live correctness bug, only a latent one that would surface the moment a consumer tries to walk the provenance spine by id.

  Also left bare in the same stream (a separate, larger follow-on): the vector/similarity path — `IVectorIndex` / `InMemoryCosineIndex._vectors`, `IEntityResolutionCandidate.id`, and `ResolutionVerdict`'s `target: MemoryId` arms + their `_indexById`/`byId` bare lookups in the orchestrator. Those share the root cause but were deliberately scoped out (the ingest verdict/similarity path still keys on a bare `byId` snapshot index).

  **Trigger**: when a consumer needs to dereference `derivedFrom` (or the vector/verdict path) back to a specific record, or when the vector-path scoping is picked up as its own stream.

  **Scope sketch**: promote `derivedFrom` to `IEdgeTarget` (or a `{ scope, id }` pair) and fix the ingest stamping site; for the vector path, scope `IVectorIndex` keys and the verdict target arms together (they interlock through `_indexById`).

  **Not a P2**: `derivedFrom` is never dereferenced today, so there is no functional gap — purely latent.

  **Reference**: the `agent-memory-scoped-edges` stream (scope-qualified `IEdge.target`). The design explicitly deferred both `derivedFrom` and the vector/verdict path as out-of-scope.

- **[P2] `ts-prompt-assist` (and adjacent `ts-res` qualifier surface) needs an API documentation pass once the v0.1 surface settles.**
  PR #380 review surfaced that the recently-extended `ts-prompt-assist` surface — `PromptLibrary` + `IPromptLibraryCreateParams` + `IPromptResolveRequest` + the related fixture / resource-binding / resolve-output types — carries minimal TSDoc on individual methods, parameters, and return shapes. The v0.1 surface has been moving fast (Phase B sub-phases + post-merge cleanups + surface-tidy + round-1 ergonomics absorption), so documenting heavily during churn was the right call; with v0.1 effectively settled now, the next concern is consumer-facing TSDoc quality on the public surface.

  A related pattern Erik flagged in the same PR #380 review: **inline anonymous types + union types should be extracted to named `type` / `interface` declarations** so they have a single place to attach TSDoc. The library currently has a few patterns like `qualifiers: IReadOnlyQualifierCollector | ReadonlyArray<TAxes | (IQualifierDecl & { readonly name: TAxes })>` that would benefit from a named extracted type.

  **Trigger**: post-round-2 pressure-test, once the consumer port (agent chat application) confirms the surface is stable. Don't run this during cluster-close — let the round-2 absorption settle first so the docs don't have to be rewritten after.

  **Scope sketch**: commission a documentation-pass agent against `@fgv/ts-prompt-assist`'s public surface (and any new `@fgv/ts-res` qualifier surface from PR B). For each exported type / class / method:
  - Audit TSDoc presence + quality (does it answer "why" not just "what"; do `@public` symbols have useful `@remarks`).
  - Extract inline anonymous types + unions to named declarations where extraction creates a meaningful single-attach-point for documentation.
  - Cross-link related types via `{@link}` directives.
  - Run api-extractor; verify all `// @public` types have non-`(undocumented)` flags.

  Compare quality bar to `@fgv/ts-utils`'s base packlet, which is the reference for documentation depth.

  **Not a P3**: the surface is public alpha-stage and being consumed; opaque type signatures degrade the consumer-port experience materially. P2 trigger ("post-round-2 stable") puts it on a natural cadence.

  **Not a P1**: no functional gap; the surface works; this is documentation polish on shipped code.

  **Reference**: PR #380 (round-1 ergonomics PR C) — Erik's review surfaced both the doc gap and the inline-types pattern. Cluster spans `libraries/ts-prompt-assist` + the `ts-res` qualifier collector surface PR B extended.

- **[P2] `@fgv/ts-web-extras` lint content cleanup (config landed; 126 source violations remain).**
  Local sweep (chore/comprehensive-lint-fix) added the missing `eslint.config.js` to three sibling packages (`ts-http-storage`, `ts-random`, `tools/repo-template`) which all pass clean. Adding the same config to `ts-web-extras` surfaces **126 problems (6 errors + 120 warnings)** that were hidden while the config was missing. The config addition for `ts-web-extras` is therefore being held back until the source violations are resolved; the package continues to bypass the lint gate in the meantime.

  Rule-violation breakdown:
  | Rule | Count | Character |
  |---|---|---|
  | `@typescript-eslint/naming-convention` | 52 | DOM-mirror interfaces in `file-api-types/` (`FileSystemHandle`, `FileSystemFileHandle`, `FileSystemDirectoryHandle`, etc.) + test `Mock*` types missing `I` prefix |
  | `@typescript-eslint/no-explicit-any` | 24 | Real `any` types in fileApiTreeAccessors / fileSystemAccessTreeAccessors / mocks — repo-banned |
  | `@typescript-eslint/explicit-member-accessibility` | 17 | Missing `public` / `private` modifiers |
  | `@rushstack/typedef-var` | 8 | Missing type annotations |
  | `@typescript-eslint/no-unused-vars` | 7 | Mechanical cleanup |
  | `@rushstack/no-new-null` | 6 | File API mirrors that use `null` (browser convention) |
  | `no-void` | 4 errors | `return void x` pattern; mechanical fix |
  | `require-yield` | 2 | Likely async-generator issues |
  | `@rushstack/packlets/mechanics` | 2 | Packlet boundary |
  | `import/no-internal-modules` | 1 error | Plugin rule definition missing — config-side fix |
  | `require-atomic-updates` | 1 error | `globalThis.fetch = ...` race condition flag in tests; needs human review |
  | Other | 2 | `prefer-const`, `typedef` |

  **Trigger**: next time `ts-web-extras` is open for substantive changes, or before the next `release → main` promotion (so we don't keep shipping un-linted browser-side code).

  **Scope sketch**: three policy questions to adjudicate before mechanical work:
  1. **DOM-mirror naming.** The 3 DOM-mirror interfaces in `file-api-types/` intentionally match browser API names. Recommend: scoped rule override for that file rather than rename. Per CODING_STANDARDS, surface to orchestrator before disabling.
  2. **`no-explicit-any` (24 violations).** These violate the repo's "absolute and non-negotiable" Priority-1 rule. Genuine fixes required (likely `unknown` + cast in test mocks; real types in production adapters).
  3. **Test-file `Mock*` interface names.** Either rename (mechanical) or apply a test-file-scoped override.

  After adjudication, mechanical fixes for the rest are straightforward (4× `no-void`, 17× missing accessibility, 8× missing typedefs, 7× unused vars, 1× `prefer-const`, etc.). The `require-atomic-updates` and `import/no-internal-modules` errors need individual investigation.

  **Not a P1**: shipped code; no production breakage; downstream consumers integrate it. P2 because the gate is actively bypassed for browser-side changes.

  **Reference**: PR #353 (this stream) added the three sibling configs and confirmed scope; original P2 entry from PR #350 (cluster close) reframed.

- **[P2] Replace try/catch + instanceof-Error boilerplate in `ai-assist/apiClient.ts` with `captureAsyncResult`.**
  Four identical `catch (err: unknown) { const detail = err instanceof Error ? err.message : String(err); return fail(...detail...); }` blocks at lines ~158, 217, 272, 316. Each carries a `/* c8 ignore next 1 - defensive: fetch errors are always Error instances in practice */` directive to suppress the untestable catch branch — a signal that `captureAsyncResult()` is the right replacement. `captureAsyncResult` handles the `Error`-vs-string normalisation internally and makes the `c8 ignore` directives unnecessary.

  **Trigger**: next time `apiClient.ts` is open for substantive changes (e.g. adding a new provider).

  **Scope sketch**: wrap each `try { response = await fetch(...) } catch` block with `captureAsyncResult(() => fetch(...))`, then chain `.withErrorFormat((msg) => \`AI API request failed: ${msg}\`)`. The `c8 ignore` directives on the catch lines can be removed once the blocks are gone.

  **Not a P3**: the `c8 ignore` directives are suppressing real untestability; the boilerplate pattern appears four times and will grow with each new provider endpoint.

  **Reference**: PR #329 review — patterns pre-existed the PR, absolved from that review.

- **[P2] Cross-runtime entry-point export parity is not systematically tested.**
  Libraries with both Node (`src/index.ts`) and browser (`src/index.browser.ts`) entry points can drift in export names without CI catching it. api-extractor runs only on the Node entry point, so a typo or rename in the browser entry slips through. Pattern has bitten the team three times: `@fgv/ts-extras` exported `Crypto` instead of `CryptoUtils` (personaility web app); `@fgv/ts-extras` missed `Yaml` entirely (ts-prompt-assist sample app, fixed in #377); plus the earlier `repo-template` issue. **`@fgv/ts-extras` now has the recommended micro-test** (`src/test/unit/index.browser.test.ts` asserts every top-level name in `index.ts` is also in `index.browser.ts`); other libraries with browser entries still need it.

  Comprehensive per-export coverage on every library is too expensive given the API surface. The right scope is opportunistic per-library micro-tests.

  **Libraries with `*.browser.ts` entries that still need the micro-test:** `ts-bcp47`, `ts-res`, `ts-web-extras`, `ts-app-shell`, `ts-res-ui-components`, `ts-json`, `ts-json-base`, `ts-sudoku-lib`, `ts-sudoku-ui`.

  **Trigger**: anytime one of those libraries' `index.browser.ts` is touched substantively (new exports added, namespace renames, refactors). Also: anytime a cross-runtime export bug is reported, expand the affected library's micro-test rather than just patching the single export.

  **Scope sketch**: copy the pattern from `@fgv/ts-extras/src/test/unit/index.browser.test.ts` — imports both `index.ts` and `index.browser.ts` directly via relative paths, asserts every top-level name exported from Node is also exported from browser. Browser may have additional names (e.g. back-compat aliases) but nothing Node ships may go missing on browser. Per-library cost: ~15 lines.

  **Not a P3**: the pattern has recurred multiple times across the team; the consumer-impact cost (production-visible undefined exports) is real. P2 trigger ("next time the browser entry is touched") puts it on a natural cadence.

  **Reference**: PR #377 (ts-extras Yaml fix + micro-test pattern landed); original L13 lessons-pending entry; earlier ts-extras `Crypto` bug.

## P3 — Opportunistic cleanup

- **[P3] `ts-agent-memory` L2 `createMemoryTools` duplicates the store's codec wiring instead of delegating.**
  `createMemoryTools({ codecs?, defaultCodec? })` (`libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts`) accepts the per-kind identity codecs a second time, in addition to `FileTreeMemoryStore.create({ codecs })`. `memory_write` needs them because `IMemoryStore.put` (`fileTreeMemoryStore.ts:496-502`) validates `envelope.id === codec-derived idStem` and does not derive/stamp the id itself — so a caller building a new `IMemoryRecord` must compute the same `idStem` up front, which requires the same codec the store was constructed with. The testbed scenario passes the same `codecs` map to both constructors, illustrating the drift risk: a host that re-wires the store's codecs but forgets the mirrored `createMemoryTools` config gets a confusing "envelope id does not match codec-derived stem" failure at `put()` time. Scope isolation is NOT compromised (codec `scope` is derived deterministically from `kind`, not from agent input; a mismatch loudly rejects the write rather than writing cross-scope), so this is a DX/robustness smell, not a security gap.

  **Trigger**: when the temporal write path lands (it touches the same `IMemoryStore` write surface) or the next time `createMemoryTools` is extended.

  **Scope sketch**: add an additive method to `IMemoryStore` — e.g. `resolveWriteAddress(kind, entityId): Result<IIdentityCodecResult>` delegating to the store's already-configured `codecs`/`defaultCodec` — and have `memory_write` call it, dropping the `codecs?`/`defaultCodec?` params from `ICreateMemoryToolsParams`. Purely additive on the active `ts-agent-memory` surface; removes the duplicate config and the drift failure mode.

  **Reference**: `agent-memory-l2-tools` stream; code-reviewer pass on the L2 diff (2026-07-07).

- **[P3] ai-assist model-alias layer does NOT cover capability-detection or the typed `*ModelNames` unions — both stay manual on a provider line rotation.**
  The `@<provider>:<role>` alias layer (`ai-assist-model-aliases` stream) fixes model *selection/default* churn: a line rotation is one edit to a descriptor's `aliases` map plus a testbed run. It deliberately does **not** touch two adjacent axes, which still need a manual bump (design §3):

  1. **The capability-detection `idPattern` rules** (`libraries/ts-extras/src/packlets/ai-assist/registry.ts`, the `DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider` block). These classify the concrete ids a provider's `listModels` endpoint returns (never aliases). When a new line ships (e.g. `gemini-4.x`), the rules need a matching `idPattern` sibling — without it, new ids fall to the base capability set and are mis-classified (e.g. a thinking-capable model detected as non-thinking). Tier 2 added `/^gemini-3/ → ['chat','tools','vision','thinking']`; the next line needs the same hand-edit.
  2. **The typed `*ModelNames` unions** (`model.ts` — `GeminiThinkingModelNames`, `GeminiFlashImageModelNames`, the parallel `OpenAiThinkingModelNames`, etc.) used by the layered-options `models?` filter arrays. They enumerate concrete ids for compile-time ergonomics and must track real ids on a deprecation. Tier 2 bumped the Gemini unions to the 3.x ids by hand.

  **Trigger**: any future provider line rotation (Google/OpenAI/etc.), or when a `listModels` mis-classification or a stale `models?` filter id surfaces.

  **Scope sketch**: per rotation, add/adjust the provider's `idPattern` rule(s) and bump the corresponding `*ModelNames` union(s) alongside the one-line `aliases` map edit. A follow-on could additively allow aliases inside the `models?` arrays (so the unions stop enumerating concrete ids), but that is a separate design — out of the alias stream's scope.

  **Not a P2**: no shipped-behavior regression; the alias layer's value is precisely bounded and the doc (`LIBRARY_CAPABILITIES.md`, packlet README) states the boundary explicitly. This entry exists so the two manual axes are not forgotten on the next rotation.

  **Reference**: `ai-assist-model-aliases` design §3 + Tier 2 manual-axis bumps (`.ai/tasks/active/ai-assist-model-aliases/state.md`).

- **[P3] Port `samples/ai-image-gen-sample` scenarios into `samples/testbed`.**
  The new general-purpose `samples/testbed` sample-browser (commissioned via `local-ai-exploration` cluster, 2026-05-22) is the canonical home for fgv-capability scenarios going forward. The existing `samples/ai-image-gen-sample` predates the testbed and has its own webpack pipeline + scenario shapes; its content (image generation against multiple providers, prompt-assist round-2 demo, etc.) should be ported into the testbed once the testbed shell is established.

  **Trigger**: after `local-ai-exploration` cluster ships and the testbed has at least 2-3 native scenarios proving the shell + scenario contract are stable.

  **Scope sketch**: port each `ai-image-gen-sample` scenario as a testbed `IScenario` web impl. Pull data from the existing sample's fixture pattern into the testbed's `data/` pipeline. Decide whether to retire `samples/ai-image-gen-sample` entirely (lean: retire — one canonical sample app, not two) or keep it as a "minimal sample skeleton" reference for consumers who want a single-purpose app shape.

  **Not a P1**: existing sample works as-is; consumer-visible behavior unchanged either way.

  **Not a P2**: the testbed has to land + stabilize before the port has a real target. P3 reflects "do this once the testbed earns the right to absorb."

  **Reference**: `local-ai-exploration` cluster brief at `.ai/tasks/active/local-ai-exploration/brief.md`; Erik 2026-05-22 ("we should probably add tech debt to port the ai image scenarios over as well").

- **[P3] New pure-library packages must declare `"sideEffects": false` in `package.json`.**
  Every `libraries/` package whose `src/index.ts` exports only functions and types (no module-level side effects) carries `"sideEffects": false` so bundlers can tree-shake it. This was caught in PR review on `crypto-batch-2-webauthn`: `@fgv/ts-extras-webauthn` was missing the field; `@fgv/ts-web-extras-webauthn` had it. Fixed in-stream, but the gap reveals a scaffolding-checklist hole — the standard "new package" template doesn't enforce it.

  **Trigger**: next stream that creates a new pure-library package, or next time someone refactors the scaffolding template / `rush.json` registration guide.

  **Scope sketch**: (a) audit existing `libraries/*/package.json` to confirm everyone has the field correctly set (one quick grep), and (b) add a line to the per-package scaffolding doc / convention note that flags `"sideEffects": false` as required alongside `"main"` and `"types"`. Optionally add a tiny test or pre-PR check that fails when a `libraries/` package is missing the field and has no module-level side effects.

  **Not a P2**: failure mode is "consumer bundle size slightly larger than necessary," not a functional regression.

  **Reference**: PR #347 review (crypto-batch-2-webauthn); lesson captured in `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/README.md` § L1.

- **[P3] `resolveImageCapability` in `ai-assist/registry.ts` returns `| undefined` instead of `Result<IAiImageModelCapability>`.**
  `registry.ts:328–339`. The function returns `undefined` when no capability matches `modelId`, silently swallowing the "unknown model" case. Callers must null-check rather than chain. Returning `Result<IAiImageModelCapability>` with a contextual error message would let callers propagate the failure cleanly.

  **Trigger**: next substantive change to the provider registry or capability resolution path.

  **Scope sketch**: change return type to `Result<IAiImageModelCapability>`; return `fail(\`model '${modelId}' not found in provider '${descriptor.name}' image capabilities\`)` when the reduce produces `undefined`; update call sites (primarily in `apiClient.ts`) to chain off the result.

  **Not a P2**: the function is currently only called in contexts that already handle `undefined` defensively; behaviour is correct, just non-idiomatic.

  **Reference**: PR #329 review — pattern pre-existed the PR, absolved from that review.

- **[P3] `ai-assist/apiClient.ts` is at the 2000-line `max-lines` cap; decompose it.**
  `libraries/ts-extras/src/packlets/ai-assist/apiClient.ts` sits right at the ESLint `max-lines` ceiling (2000). It is a monolith spanning four largely-independent concerns: chat completion (OpenAI/Anthropic/Gemini adapters + dispatcher), image generation (adapters + dispatcher + response validators), list-models (adapters + capability resolution), and the proxied variants of all three. Every additive change to any one concern now requires trimming JSDoc elsewhere in the file purely to stay under the cap — this happened repeatedly on `ai-assist-message-ordering` (PR #478), where each Copilot round that added a proxy-path guard forced compensating comment cuts. This is unsustainable: doc quality is being traded for line budget, and the next feature touching this file will hit the wall immediately.

  **Trigger**: next substantive change to `apiClient.ts` (any new provider adapter, image format, list-models source, or proxy field), or proactively before the next ai-assist feature stream.

  **Scope sketch**: split by concern into sibling modules under `ai-assist/` (e.g. `completionClient.ts`, `imageGenerationClient.ts`, `listModelsClient.ts`, and a `proxiedClient.ts` — or co-locate each proxied variant with its direct sibling), keeping the shared HTTP helpers (`fetchJson`/`fetchMultipart`/`fetchGetJson`) and response validators in a small internal module. Re-export the public surface unchanged from `index.ts` so `etc/ts-extras.api.md` is unaffected (pure file-organization move, no API change → Rush change `none`). Verify per-file `max-lines` compliance without JSDoc trimming.

  **Not a P2**: no functional or API impact; the file works correctly. This is a maintainability/headroom issue — but it becomes a soft blocker on the *next* edit, so it should be done before, not during, the next feature.

  **Reference**: PR #478 (`ai-assist-message-ordering`) — repeated JSDoc trims to keep the file ≤2000 lines while adding proxy-path validation guards; Erik 2026-06-07 ("we won't be able to cut lines every time").

## P4 — Doc / minor consistency

- **[P4] `mutableFsTree` `permission-denied for read-only file` test fails when the test container runs as root.**
  `@fgv/ts-json-base` `mutableFsTree` suite — one test expects `chmod`-based read-only enforcement to block a write. When the test container runs as root (the default in the cloud-agent harness), `chmod` is advisory; the kernel lets root write read-only files regardless. Reproduces on the `release` baseline; **not a regression** from any recent stream. Surfaced (and explicitly dispositioned as unrelated) during the `capture-async-result-upgrade` full-repo `rush test` sweep (PR #433).

  **Trigger**: opportunistic — next time the `mutableFsTree` test surface is open, or when CI logs become a meaningful nuisance.

  **Scope sketch**: gate the assertion on `process.getuid?.() !== 0` (skip the read-only-enforcement check under root); or rewrite the assertion to use a `FileTree` adapter capability check rather than relying on `chmod` semantics. Single-test scope; behavior of the production code is fine.

  **Not a P3**: no shipped-behavior impact and no functional regression; this is a sandbox-specific test-environment quirk.

  **Reference**: PR #433 (`capture-async-result-upgrade`) full-repo `rush test` sweep; reproduced on `release` baseline.

