# Stream Brief: ts-prompt-assist — sub-phase B-1b (foundation hardening)

**Stream ID:** ts-prompt-assist
**Phase:** B — implementation
**Sub-phase:** B-1b — foundation hardening (post B-1, pre B-2)
**Cluster:** `ts-prompt-assist-features` (integration branch `claude/ts-prompt-assist-features`)
**Base branch for B-1b:** `claude/ts-prompt-assist-features` (after PR #362 lands)
**PR target:** `claude/ts-prompt-assist-features` (NOT release)
**Workflow shape:** scoped agent commission, same shape as B-1 (cold start against the artifacts; no carried context)

---

## Why B-1b exists

B-1 (PR #362, `cc0df79c`) landed the foundation: package skeleton, full type system, Converters, unified `IPromptRegistry<TResponse>`, read-only `FileTreePromptStore`, `PromptStoreFixture`, chain walker, binding merger, `MustacheTemplateCache`, `PromptLibrary.create` / `describe` / `resolve`. 71 tests, 100% coverage, build/lint/api-extractor clean.

What B-1 explicitly **did not** ship (and which gates B-2 / B-4 cleanly landing on top):

1. **ts-res integration.** The B-1 candidate selector is a standalone in-record matcher. The design (§15.5 Option C, NQ-5 resolved §17.1) requires a long-lived `ResourceManagerBuilder` inside `PromptLibrary` that ingests records via `addLooseCandidate` on cache miss and drives a `ResourceResolver` for actual candidate selection. **B-2 cannot resolve resource bindings without this** — resource bindings recurse through `PromptLibrary.resolve` and the recursive path expects ts-res semantics (qualifier types, `scoreAsDefault`, `priority`, intrinsic O(1) caches).
2. **Copilot review fallout.** Two passes of Copilot review on PR #362 produced ~30 comments. 8 are fixed; the rest are annotated inline with `// Copilot review (PR #362, deferred to B-1b)` breadcrumbs. Several are real correctness gaps that B-1b should close before B-2 builds on a brittle foundation.

B-1b is therefore **hardening + ts-res integration**, NOT a feature sub-phase. The library's exported surface should remain stable across B-1b — internal implementations move, public types do not (with the noted exceptions called out in §"Surface changes" below).

---

## Required reading (priority order)

1. `.ai/tasks/active/ts-prompt-assist/brief-phase-b-1b.md` (this file) — binding contract
2. `.ai/tasks/active/ts-prompt-assist/brief-phase-b.md` — parent phase brief; especially the 10 Guardrails at the top (all binding, unchanged)
3. `.ai/tasks/active/ts-prompt-assist/design.md` — locked design. Especially:
   - §15.5 (Option C: lazy materialization into a shared `ResourceManagerBuilder`)
   - §17.1 (NQ-5 resolved — Option C achievable with zero ts-res changes)
   - §17.2 (validator-chain redesign; ConverterRegistry kind-tracking)
   - §10.2 (`isPartial` chain composition)
   - §10.4 (cross-scope binding merge, `enforced` lock)
4. `.ai/tasks/active/ts-prompt-assist/state.md` — phase B history + B-1 deliverable record
5. `libraries/ts-prompt-assist/src/` — the B-1 foundation. Every file with a `// Copilot review (PR #362, deferred to B-1b)` comment is in B-1b's scope.
6. `libraries/ts-res/src/packlets/resources/resourceManagerBuilder.ts` — the ts-res primitive B-1b drives (especially `addLooseCandidate`, `addResource`, `getBuiltResource`, `validateContext`)
7. `libraries/ts-res/src/packlets/runtime/resourceResolver.ts` — the ts-res resolver B-1b instantiates (especially `resolveAllResourceCandidates`)
8. PR #362 review thread on GitHub — Copilot's full review record; the annotations in source cite "Copilot review (PR #362, deferred to B-1b)" but the original thread has the verbatim text

---

## B-1b scope (binding)

### Part 1: ts-res integration — replace the candidate selector

The current `libraries/ts-prompt-assist/src/packlets/resolve/candidateSelector.ts` is a stand-in matcher. Replace it with the design §15.5 Option C architecture:

1. `PromptLibrary` constructs **one long-lived `ResourceManagerBuilder`** at `create()` time, parameterized by the consumer-supplied `qualifiers` (per design §4.1 `IPromptLibraryCreateParams.qualifiers` — `IReadOnlyQualifierCollector | ReadonlyArray<IQualifierDecl>`). Currently the `qualifiers` create-param is missing entirely; add it.
2. Per-resolve flow:
   - Chain walker still finds the winning `IStoredPromptRecord` (unchanged).
   - Compute `key = (scope, id, Crc32Normalizer.computeHash(record.candidates))`. On miss, validate each `IPromptCandidateRecord` via ts-res's `ResourceJson.Convert.conditionSetDecl` + a candidate-decl Converter, then call `builder.addLooseCandidate({ id: <synthesized>, json: { body: candidate.body }, conditions: candidate.conditions, isPartial: candidate.isPartial })`. Record the synthesized id in a materialized-resource map keyed by the hash.
   - Build a `ResourceResolver` against the long-lived builder (which implements `IResourceManager` per §17.1) and the caller's qualifier context (via `SimpleContextQualifierProvider` / `ValidatingSimpleContextQualifierProvider`).
   - Call `resolver.resolveAllResourceCandidates(synthesizedId)` to get matching candidates in priority order. Walk specificity-ascending per §10.2; collect bodies until a terminal (`isPartial !== true`); Mustache renders **once** on the joined body.
3. Trace surfacing per design §4.2:
   - `ICandidateMatchTraceEntry.matchType` now correctly emits `'match'` vs `'matchAsDefault'` based on ts-res's actual disposition (B-1 always emitted `'match'`).
   - `ICandidateMatchTraceEntry.conditions: ReadonlyArray<IConditionMatchResult>` is populated from ts-res's per-condition match results (B-1 emitted `[]`).
4. `IPromptLibraryCreateParams<TResponse>` gains:
   - `qualifiers: IReadOnlyQualifierCollector | ReadonlyArray<IQualifierDecl>` (required; per §4.1).
   - `qualifierTypes?: ReadOnlyQualifierTypeCollector` (optional; needed when `qualifiers` is supplied as decls; per §4.1).
   - `cacheListener?: IResourceResolverCacheListener` (optional; per §4.1).
   - `logger?: Logging.ILogger` (optional, defaults to `Logging.noOpLogger`; per §4.1).
   - `resourceBindingDepthLimit?: number` (default 5; per §4.1 — but resource binding itself is B-2; the create-param surface should be present so B-2 can wire without reshaping).
5. Remove the standalone `candidateSelector.ts` (or keep an internal helper that's only used for the trace-projection step from ts-res's matched candidates to `ICandidateMatchTraceEntry[]`).
6. Update `PromptStoreFixture` to thread the qualifier config through. Either: (a) accept a `qualifiers` field on the seed and have the fixture build a `QualifierCollector` and pass it on to `PromptLibrary.create`; or (b) require consumers to construct the registry/qualifiers in the test setup and pass directly to `PromptLibrary.create`. The current fixture seed already accepts `qualifiers?: ReadonlyArray<Qualifiers.IQualifierDecl>` — wire it through.

**Acceptance:** every B-1 test continues to pass against the new candidate selector (with potentially minor signature adjustments for test setup), and an additional test demonstrates ts-res `scoreAsDefault` participation that B-1's stand-in selector could not express.

### Part 2: Copilot review deferrals — concrete fix list

Each entry below is annotated in source today with a `// Copilot review (PR #362, deferred to B-1b)` comment. B-1b's PR should close each one — either by applying the fix and removing the annotation, or by escalating to the orchestrator with a clear "this is wrong / not feasible / belongs in B-2/B-3/B-4" rationale.

#### 2.1 `SlotName` Mustache-identifier validation
**Location:** `libraries/ts-prompt-assist/src/packlets/types/ids.ts` (the `brandedString` helper, applied to `SlotName`).
**Concern:** A `SlotName` like `'foo.bar'` would be parsed by Mustache as a section path `foo` → `bar`, not as a flat key. `_buildRenderContext` indexes by the verbatim slot name; mismatch silently misrenders.
**Fix:** Tighten `Convert.slotName` (and only `slotName` — other ids don't have this constraint) to require the Mustache "name" production: `/^[A-Za-z_][A-Za-z0-9_]*$/`. Add a dedicated test exercising `'foo.bar'` rejection.
**Cross-reference:** also called out in `promptLibrary.ts` `_buildRenderContext` review note.

#### 2.2 `brandedString` minimal hygiene
**Location:** `libraries/ts-prompt-assist/src/packlets/types/ids.ts` `brandedString` helper.
**Concern:** Only checks non-empty. No length cap, no whitespace rejection. Downstream consumers assume more (e.g. `ScopeKey` is path-mapped; `PromptId` is used in cache keys).
**Fix:** Per-brand minimum hygiene:
- All brands: reject leading/trailing whitespace; cap length at a sane bound (e.g. 256).
- `PromptId`: additionally reject `::` (eliminates the cache-key collision risk called out in `mustacheCache.ts`).
- `SlotName`: see 2.1.
- `ScopeKey`: continue to delegate path-safety to `defaultScopeEncoding` (the bare brand still allows non-portable chars for consumers using a custom encoder).

#### 2.3 `MustacheTemplateCache` key collision
**Location:** `libraries/ts-prompt-assist/src/packlets/resolve/mustacheCache.ts` (key format `${promptId}::${bodyHash}`).
**Concern:** If a `PromptId` ever contained `::`, two different prompts could collide on the cache key.
**Fix path A** (preferred — eliminates risk structurally): convert the cache from `Map<string, MustacheTemplate>` to `Map<PromptId, Map<string, MustacheTemplate>>` (nested). LRU bookkeeping needs to be re-derived (track a single insertion-order list across the nested maps).
**Fix path B** (lighter, depends on 2.2): if `PromptId` is now validated to reject `::`, the flat `${promptId}::${bodyHash}` is collision-free and only needs a comment confirming the dependency on 2.2.
Recommend path B if 2.2 lands; otherwise path A.

#### 2.4 `ConverterRegistry.get<T>` cast
**Location:** `libraries/ts-prompt-assist/src/packlets/registry/converterRegistry.ts` line ~58, the `as unknown as Converter<T>` narrowing.
**Concern:** The cast is design-sanctioned (§17.2.5) but does not verify at the type system OR at runtime that the caller's `T` matches the stored `kind`.
**Fix:** Either:
- (a) Drop the `T` type parameter on `get` entirely — return `Result<Converter<TResponse>>`. Consumers narrow via `value.kind` at call time. The B-4 chain runner does this anyway. This makes the registry surface honest at the cost of slightly more verbose call sites.
- (b) Add a runtime-verified overload `get<T extends TResponse>(id: ConverterId, kind: T['kind']): Result<Converter<T>>` that fails when `entry.kind !== kind`. Keep the no-kind overload for the loose case.
Recommend (b) — it preserves the narrowed-result ergonomics that §17.2's example consumer code uses while plugging the type-system gap.

#### 2.5 `promptFileConverter` double-traversal
**Location:** `libraries/ts-prompt-assist/src/packlets/converters/descriptorConverter.ts` lines ~189-213.
**Concern:** `descriptorConverter.convert(from)` runs over the whole object including the `candidates` field; then `Converters.arrayOf(...).convert(raw.candidates)` re-parses the same field. Wasteful, and if `Converters.object` ever ships strict-by-default this will start rejecting prompt files outright.
**Fix:** Split the raw input explicitly:
```ts
const { candidates, ...descriptorRaw } = from as { readonly candidates?: unknown };
return descriptorConverter.convert(descriptorRaw).onSuccess((descriptor) => ...)
```
Keep the body-token-scan step (`scanCandidateBody`) on each candidate body as-is.

#### 2.6 `_slotBindingHolder` mutable-singleton pattern
**Location:** `libraries/ts-prompt-assist/src/packlets/converters/bindingConverters.ts` lines ~24-32.
**Concern:** Mutable module-level object populated below the converter it threads through. Untestable defensive branch (c8-ignored). Unusual for this codebase.
**Fix:** Replace with a `Converters.generic` whose inner lambda reads the late-bound `slotBindingConverter` via a closure thunk evaluated at convert time, OR refactor the recursion so `substitutionEntryConverter` is defined AFTER `slotBindingConverter` (and the `Converters.object` for `IResourceSlotBinding` uses `.optional()` deferred resolution).

#### 2.7 `joinBodies` `trimTrailingWhitespace` regex narrow contract
**Location:** `libraries/ts-prompt-assist/src/packlets/resolve/candidateSelector.ts` line ~118 (the `replace(/[ \t]*\n+\s*$/, '')` line).
**Concern:** The option is named `trimTrailingWhitespace` but the regex only strips trailing newlines preceded by spaces/tabs. A body ending in just trailing spaces (`'hello '`) is NOT trimmed.
**Fix:** Either:
- Widen the regex to `/\s+$/` (true trailing-whitespace strip), OR
- Rename the option (e.g. `trimTrailingBlankLines`) to clarify the narrower contract.
The first is more consistent with the option name; the second preserves the YAML-block-scalar quirk that motivated the option in design §10.2. Recommend the first; B-1b should also add a test exercising the "trailing space only" case.
**Note:** if Part 1's ts-res integration replaces the candidate selector entirely, this concern may move to wherever the joined-body logic lands. The regex needs to follow.

#### 2.8 `selectCandidates` tiebreak documentation
**Location:** `libraries/ts-prompt-assist/src/packlets/resolve/candidateSelector.ts` line ~94.
**Concern:** Ties on `specificity` are broken by sort stability + source-file order. Undocumented.
**Resolution:** Part 1's ts-res integration applies priority-based tiebreaking from ts-res's own resolution; this concern dissolves. B-1b's PR should explicitly note this in the commit message ("2.8 closed by Part 1").

#### 2.9 `IQualifierContext` flat-string vs richer `ConditionSetDecl` asymmetry
**Location:** `libraries/ts-prompt-assist/src/packlets/types/qualifiers.ts` line ~33.
**Concern:** Context is flat `Readonly<Record<string, string>>` but conditions accept `priority` / `scoreAsDefault`.
**Resolution:** This is a deliberate design decision — caller context is intentionally simple; condition complexity is descriptor-side. Part 1's ts-res integration makes this explicit because ts-res's `SimpleContextQualifierProvider` itself takes a flat `Record<string, string>`. **Action:** keep the type as-is; the TSDoc note already added in B-1 (the existing `Copilot review (PR #362, deferred to B-1b)` comment) becomes the permanent explanation. Promote the note from "deferred" to "design rationale" and remove the deferral framing.

#### 2.10 `PromptStoreFixture` eager `mapResults`
**Location:** `libraries/ts-prompt-assist/src/packlets/fixture/promptStoreFixture.ts` lines ~75-100 (the three `mapResults` calls).
**Concern:** Three `mapResults` invocations run synchronously regardless of whether earlier ones fail; only short-circuits when threaded through `onSuccess`.
**Fix:** Restructure as a single chained pipeline where each step depends on the previous, OR collapse the three mapResults into one over the union of files. The chain alternative is cleaner:
```ts
return encodeAll(seed.records).onSuccess((recordFiles) =>
  encodeAll(seed.bindings).onSuccess((bindingFiles) =>
    encodeQualifiers(seed.qualifiers).onSuccess((qualifiersFile) => ...)
  )
);
```

#### 2.11 `chainWalker` sequential `getBindings`
**Location:** `libraries/ts-prompt-assist/src/packlets/resolve/chainWalker.ts` lines ~67-78 (the second loop calling `store.getBindings`).
**Concern:** Serialized awaits across the chain. Fine for in-memory FileTree; expensive for a future remote (SQL/Mongo) adapter.
**Fix:** Parallelize via `Promise.all` once the first loop has completed:
```ts
const bindingResults = await Promise.all(chain.map((s) => store.getBindings(s)));
return mapResults(bindingResults).onSuccess((records) => ...)
```
Caller-visible behavior is unchanged; performance scales linearly with the longest single-scope latency rather than the sum.

#### 2.12 `describe` cache key + invalidation
**Location:** `libraries/ts-prompt-assist/src/packlets/resolve/promptLibrary.ts` line ~107.
**Concern:** Cache keyed by `id` alone; no invalidation hook.
**Fix:**
- (a) Cache key: keep `id` as the key — the design's invariant is that descriptors for the same id are identical across scopes. Add a load-time check (during `describe` itself, on first cache population): if `store.list({ id }).value.length > 1`, verify all entries' `descriptor` are structurally equal via `Hash.Crc32Normalizer.computeHash`. Fail loudly if not. This converts the "latent correctness hazard" into "loud at first describe call."
- (b) Invalidation: add a `// Cache invalidation deferred to B-3 (FileTreePromptStore.watch impl)` comment OR wire an early invalidation hook even though no v0.1 adapter emits events (so the consumer can call `library.invalidateDescriptor(id)` programmatically).
Recommend (a) + (b)-with-public-`invalidateDescriptor`-method.

#### 2.13 `scopeEncoding` documentation polish
**Location:** `libraries/ts-prompt-assist/src/packlets/store/scopeEncoding.ts` (already partially addressed in `cc0df79c`: basename-rejects-CON.txt).
**Concern:** The case-insensitive Aux/CON-as-brand-name rejection has no opt-out; consumers needing such names must supply a custom `scopeEncoding`. Also: `COM0` / `LPT0` are missing from the reserved set.
**Fix:**
- Extend `RESERVED_WIN_DEVICES` to `i = 0..9` (10 entries each).
- The opt-out via custom `scopeEncoding` is already the design; the TSDoc note added in `6403c851` covers it. No additional fix; close the annotation.

#### 2.14 `FileTreePromptStore.create` async-with-sync-body
**Location:** `libraries/ts-prompt-assist/src/packlets/store/fileTreePromptStore.ts` line ~65.
**Concern:** Signature is `Promise<Result<...>>` but body is `Promise.resolve(succeed(...))`.
**Resolution:** Forward-compatibility with FsTree adapters. The TSDoc note added in `cc0df79c` covers it. No fix; close the annotation.

#### 2.15 `bindingMerger` cross-scope intent
**Location:** `libraries/ts-prompt-assist/src/packlets/resolve/bindingMerger.ts` line ~37+.
**Concern:** Bindings from scopes more specific than `winningScope` still contribute to the merge.
**Resolution:** Intentional per design §10.4 ("Binding merge IS cross-scope"). The TSDoc note added in `cc0df79c` covers it. No fix; close the annotation.

#### 2.16 `resolveAndValidateOutput` pays full resolve cost before B-4 deferral
**Location:** `libraries/ts-prompt-assist/src/packlets/resolve/promptLibrary.ts` line ~210.
**Concern:** Calls `this.resolve(req)` before failing with the B-4 deferral message.
**Resolution:** Erik's resolution note + the existing TSDoc explanation suffice: the resolve cost is necessary anyway once B-4 implements the real pipeline. **Close in B-1b**: remove the deferral annotation (resolve-first is the correct shape).

### Part 3: state.md + acceptance

- `state.md` entry for B-1b documents what landed.
- B-1b PR description includes a section "Closes B-1 deferrals" listing 2.1 through 2.16 with one-line status (Fixed / Documented / Subsumed by Part 1 / Closed as intent).
- All `// Copilot review (PR #362, deferred to B-1b)` comments removed by end of B-1b (either fix the issue + remove, or convert to "design rationale" / "intentional per §X" framing).
- Build / lint / test pass with 100% coverage on `ts-prompt-assist`.

---

## Surface changes from B-1 (non-breaking + breaking-on-new-surface)

The B-1 surface that ships in PR #362 has these expected B-1b changes:

| Surface | B-1 | B-1b |
|---|---|---|
| `IPromptLibraryCreateParams<TResponse>` | `{ store, registry?, templateCacheSize? }` | gains `qualifiers` (required), `qualifierTypes?`, `cacheListener?`, `logger?`, `resourceBindingDepthLimit?` per design §4.1 |
| `PromptLibrary.create` | takes B-1 minimal params | takes design §4.1 full params; internally builds long-lived `ResourceManagerBuilder` |
| `ConverterRegistry.get<T>` | unchecked cast | runtime-verified `get<T>(id, kind: T['kind'])` overload added; loose `get(id)` kept for the no-kind case |
| `selectCandidates` / `candidateSelector.ts` | standalone matcher | removed or relegated to trace-projection helper |
| `Convert.slotName` | non-empty only | Mustache-identifier regex |
| `Convert.promptId` | non-empty only | additionally rejects `::` |
| `IPromptStoreFixtureSeed.qualifiers` | accepted but not used in PromptLibrary fixture | passed through to PromptLibrary.create alongside the store |

The "breaking-on-new-surface" framing is per `ACTIVE_DEVELOPMENT.md`: `@fgv/ts-prompt-assist` is on the active-development surface, so consumer-facing changes are free-hand until v0.x stabilizes. Document each surface change in the B-1b PR description so the pressure-test consumer can absorb cleanly.

---

## Out of scope for B-1b

- **B-2 work** (resource-binding resolution: recursive resolver, cycle detection, depth-cap enforcement, OQ-2 strict-replace, `IResourceBindingTraceEntry.innerTrace` recursive surfacing). The resource-binding TYPE shape is in B-1; the resolve-time RESOLUTION is B-2. Even though Part 1's ts-res integration is technically a prerequisite for resource bindings, B-1b stops at the single-prompt resolve path. The `IResourceSlotBinding` failure-loud message in `serializeResource` stays.
- **B-3 work** (`FsTree` smoke test; filename-id consistency check in `descriptorConverter`; `_qualifiers.yaml` root-level loading hardening).
- **B-4 work** (full `resolveAndValidateOutput<T>` pipeline; input safeguards beyond `enforced-override-ignored`).
- **B-5 work** (README, LIBRARY_CAPABILITIES.md update, rush change file).

If B-1b's work surfaces a clean B-2 prerequisite that the brief above doesn't mention, **STOP and surface to the orchestrator** rather than expanding scope.

---

## Pre-PR gate (binding)

Same gate as B-1, per `CODING_STANDARDS.md §Pre-PR Validation Checklist`:

- [ ] `rushx build` passes in `ts-prompt-assist`
- [ ] `rushx lint` passes in `ts-prompt-assist` (load-bearing — NOT transitively run by build)
- [ ] `rushx test` passes with 100% coverage on new code
- [ ] `rushx fixlint` run before final commit
- [ ] No `any`, no `console.*`, no `node:fs`, no `JSON.stringify`-compare, no `Result<void>`, no unsafe casts in product code, no `unknown` without explicit rationale, no shadowing of `@fgv/*` types
- [ ] No inline `eslint-disable` directives added to make lint pass
- [ ] api-extractor regenerated (`etc/ts-prompt-assist.api.md`)
- [ ] `code-reviewer` agent invoked on the foundation hardening before opening the PR; findings applied
- [ ] All `// Copilot review (PR #362, deferred to B-1b)` annotations removed
- [ ] `state.md` updated with the B-1b deliverable record

---

## Branch + PR posture

- **Base branch:** `claude/ts-prompt-assist-features` (post B-1 merge)
- **Work branch:** `claude/ts-prompt-assist-phase-b-1b` (harness may auto-suffix)
- **PR target:** `claude/ts-prompt-assist-features` (NOT release — Guardrail #7)
- Single PR for all of B-1b is preferred; multi-PR is acceptable if Part 1 lands clean and Part 2 fans into several focused commits

---

## Resume protocol

If the session ends mid-phase: read `brief-phase-b-1b.md` (this file) + `design.md` (§15.5, §17.1, §17.2 binding) + `state.md` (deliverable record) to resume. Each entry under §2.1-§2.16 has a stable file:line citation pointing at the in-source `// Copilot review (PR #362, deferred to B-1b)` annotation.

---

## Missing-input rule

If a required-reading file is missing, conflicts with this brief, or you find a binding-rule conflict you can't resolve without orchestrator input (especially if Part 1's ts-res integration uncovers an `IResourceManager` API gap not present in the §17.1 audit), **STOP and surface to the orchestrator**. Don't improvise on binding decisions.
