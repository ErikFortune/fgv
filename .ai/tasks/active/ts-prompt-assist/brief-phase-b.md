# Stream Brief: ts-prompt-assist (phase B — implementation)

**Stream ID:** ts-prompt-assist
**Phase:** B — implementation
**Cluster:** `ts-prompt-assist-features` (integration branch `claude/ts-prompt-assist-features`)
**Workflow shape:** design-triage-implement-refine. Phase B implements the locked v0.1 design. "Refine" (consumer-port pressure-test) is a follow-on phase absorbed as 1–2 PRs on the same integration branch.

---

## Context

Phase A produced `.ai/tasks/active/ts-prompt-assist/design.md` (locked) and `state.md` (decision log + resolved/open questions). Phase A signoff is **complete** (PR #357 merged into the integration branch). The conceptual model, type system, library API, storage adapter shapes, YAML schema, Mustache rules, resource-binding semantics, output validation pipeline, input safeguard primitives, composition semantics, package layout, and acceptance criteria are all locked.

**This brief is the binding contract** for phase B. Where this brief and `design.md` conflict, `design.md` wins (it's the lower-level binding artifact); where `design.md` and `design-brief.md` conflict, `design.md` wins.

This is feature work on a brand-new active-development surface (`@fgv/ts-prompt-assist`, listed in `.ai/instructions/ACTIVE_DEVELOPMENT.md`) plus a strictly-additive extension to two `@fgv/ts-extras` packlets (`mustache` and `ai-assist`).

---

## Mission

Ship `@fgv/ts-prompt-assist` v0.1 per the locked `design.md`. Two libraries are in scope:

1. **`@fgv/ts-extras`** — strictly additive changes (no removed/renamed exports):
   - **`mustache` packlet**: add `escape?: MustacheEscapeStrategy` option to `MustacheTemplate.create` (per design §11.4 + OQ-6). Implementation MUST use a per-instance `Mustache.Writer` configured with the escape strategy; NO mutation of the global `Mustache.escape`. Default `'html'` preserves back-compat.
   - **`ai-assist` packlet**: promote `extractJsonText` to a stable public export (per design §15.6, resolving NQ-1). Additive only.
2. **`@fgv/ts-prompt-assist`** — new library, full v0.1 implementation per the locked design.

---

## Phase B sub-phases (advisory; per design §14)

Design §14 recommends a 7-step breakdown. The implementing agent may consolidate or split commits as long as the acceptance criteria in design §12 are met. Recommended order — particularly the **B.0 before B.1** dependency is binding:

| Step | Scope | Notes |
|---|---|---|
| **B.0** | `ts-extras/mustache` extension + `ts-extras/ai-assist` `extractJsonText` promote | **Must land before B.1.** Tests cover `escape: 'html'` (existing), `escape: 'none'`, and custom-function escape. No mutation of `Mustache.escape`. |
| **B.1** | Types + `PromptLibrary.resolve` happy path | Branded scalars, Converters for all string-unions, descriptor / bindings / candidate Converters, unified `PromptRegistry`, chain walker, binding merger (without resource bindings yet), Mustache render (consuming the B.0 `escape: 'none'`), full trace. Both composition behaviors via per-candidate `isPartial`. |
| **B.2** | Resource bindings | Recursive resolver, cycle detection (using `Hash.Crc32Normalizer.computeHash` on the chain — never `JSON.stringify`-compare), depth cap (default 5), OQ-2 strict-replace, inner-trace surfacing. |
| **B.3** | `FileTreePromptStore` + YAML loader | YAML via `@fgv/ts-extras` `yaml.yamlConverter<T>(inner)` (no new direct `js-yaml` dep at this level). Filename-id consistency check. Double-brace rejection in the descriptor Converter (via the body-token-scanner per design §6). `_qualifiers.yaml` root-level loading via ts-res's `qualifierDecl` Converter. |
| **B.4** | Output validation pipeline | Fence strip (consume `extractJsonText` from B.0's promote), `JSON.parse`, registered Converter, `outputValidations[]` chain via `MessageAggregator`. Resource-binding-to-`'json'`-descriptor rejection. |
| **B.5** | Input safeguards | Per-slot length cap, regex screen (source-aware skipping), anti-jailbreak preface seam, `safeguardFindings` trace entries (kinds `'max-length' \| 'suspicious-pattern' \| 'screening-skipped' \| 'enforced-override-ignored'`). |
| **B.6** | Docs + API Extractor + change file | README quick-start (the "pressure-test handoff package" per design §12 criterion 15), TSDoc audit, api-extractor `.api.md` regenerated for both `ts-extras` and `ts-prompt-assist`, rush change files for all modified packages. |

Each step can be a commit on the integration branch or its own PR — implementer's choice. Single phase B PR for everything is also fine. Acceptance criteria (§12) are non-negotiable.

---

## NQ-5 — ts-res incremental-add verification (orchestrator-flagged)

Design §15.5 commits to **Option C** for the candidate→ts-res handoff: one long-lived `ResourceManager` inside `PromptLibrary`, with resources materialized on demand into a shared runtime. This requires ts-res to support **incremental resource add-after-build** — adding a new resource to an already-built `ResourceManager` without rebuilding.

**Phase B step zero (B.0a, before or alongside B.0):**

1. Audit `libraries/ts-res/src/packlets/runtime/` for incremental add-after-build support.
2. If supported: lock Option C, no ts-res changes needed.
3. If not supported: implementation latitude per design §15.5:
   - **Preferred:** extend ts-res additively (new builder method or runtime API). This expands cluster scope to three libraries (ts-extras + ts-res + ts-prompt-assist) but stays strictly additive. The repo's "Extending Core Libraries Over Working Around Them" guidance in CODING_STANDARDS endorses this. Surface scope expansion to orchestrator before implementing.
   - **Acceptable fallback (ii):** periodic rebuild strategy — rebuild on first miss after N misses, or amortize via builder batches. Document trade-offs in `TECH_DEBT.md`.
   - **Acceptable last-resort (iii):** fall back to per-resolve transient `Resource` construction (Option A) with hash-keyed materialization cache. Document the gap in `TECH_DEBT.md` so v0.2 picks up Option C.

Store interface stays identical under all three paths (§15.5 final paragraph); the choice is internal to `PromptLibrary`.

**Record the NQ-5 verification outcome and chosen path in `state.md` before B.1 starts.** Phase B implementer doesn't re-litigate Option C as the target; only the implementation strategy varies.

---

## Acceptance criteria (binding — from design §12)

The integration branch is ready for promotion to `release` when:

- [ ] Type system implemented (every type from design §3, every string-union with `allFooValues` + Converter, branded-scalar Converters, discriminated-union Converters)
- [ ] `PromptLibrary.resolve` end-to-end against `FileTreePromptStore + InMemoryFileTree` test fixture: chain walk; ts-res candidate selection via `isPartial`; binding merge with `enforced` lock; caller-sub override (except enforced); Mustache render via extended `MustacheTemplate` with `escape: 'none'`; full `IPromptResolveTrace`
- [ ] `FileTreePromptStore` works against `FsTree` (smoke test) and `InMemoryFileTree` (full coverage). Loads YAML descriptors, scope-level binding records, root-level qualifier config. Rejects bodies containing double-brace or ampersand-unescape tokens with the prompt id in the error
- [ ] `resolveAndValidateOutput<T>` works for `kind: 'json'` (strip fences via `extractJsonText` → `JSON.parse` → Converter → `outputValidations[]` chain) and `kind: 'free-text'` (returns raw)
- [ ] Resource bindings resolve recursively with cycle detection + depth cap; `IResourceBindingTraceEntry.innerTrace` populated; OQ-2 strict-replace semantics tested
- [ ] Input safeguards (length cap, regex screen, source-aware skipping, anti-jailbreak preface seam) implemented and surfaced in `trace.safeguardFindings`
- [ ] Unified `IPromptRegistry` with three typed sub-registries (`converters` / `slotKinds` / `outputValidations`); single `registry` create-param; qualifier config delegated to ts-res via separate `qualifiers` create-param
- [ ] `IPromptStore.watch?` left `undefined` on `FileTreePromptStore`; `IPromptStoreEvent` shape pinned and exported (per design §4.5)
- [ ] `ts-extras/mustache` extension: additive `escape` option on `MustacheTemplate.create`, **per-instance `Mustache.Writer`** (no `Mustache.escape` global mutation), existing tests still pass, new tests cover all three escape strategies
- [ ] `ts-extras/ai-assist` `extractJsonText` promoted to stable public export
- [ ] **100% test coverage** across statements / branches / functions / lines in both modified packages (`ts-extras`, `ts-prompt-assist`) for the new code
- [ ] **No `console.*`**, **no `node:fs`**, **no `any`**, **no `JSON.stringify` structural-equality** (use `Hash.Crc32Normalizer.computeHash` per the `/value-hashing` skill) in source or tests
- [ ] Result pattern end-to-end — no exceptions out of public methods; no `Result<void>` anywhere
- [ ] TSDoc on every exported symbol; api-extractor passes
- [ ] **`rushx build` passes** in both modified packages
- [ ] **`rushx lint` passes** in both modified packages (load-bearing — NOT transitively run by build; see `CODING_STANDARDS.md` §Pre-PR Validation Checklist)
- [ ] `rushx test` passes with 100% coverage in both modified packages
- [ ] **`rushx fixlint` was run before the final commit** (catches mechanical class)
- [ ] No inline `eslint-disable` directives added to make lint pass
- [ ] `rush change` files generated for `@fgv/ts-extras` and `@fgv/ts-prompt-assist`
- [ ] `LIBRARY_CAPABILITIES.md` updated with the new `ts-prompt-assist` library entry + the additive `MustacheTemplate.create({escape})` capability + the `extractJsonText` public export
- [ ] **Pressure-test handoff package** ready: a short README in `libraries/ts-prompt-assist/` documenting `PromptLibrary.create` + `FileTreePromptStore` + a tiny example, so the consumer port can begin without reading the full design doc

---

## Package surface

### In-scope (modify / create)

- **`libraries/ts-prompt-assist/`** — full new package (per design §11.1 layout). Includes:
  - `package.json` (with `"sideEffects": false` per the new packages-checklist guidance), `tsconfig.json`, `eslint.config.js`, `config/rig.json`, `config/api-extractor.json`
  - Full `src/` tree under `packlets/` per design §11.1 (types / converters / registry / store / resolve / safeguards / output)
  - `src/test/unit/` mirroring src
  - `README.md` (pressure-test handoff quick-start)
  - `etc/ts-prompt-assist.api.md` (generated)
- **`libraries/ts-extras/src/packlets/mustache/`** — additive `escape?` option (per design §11.4); test additions for `'none'` and custom-function escape; existing tests still pass
- **`libraries/ts-extras/src/packlets/ai-assist/`** — promote `extractJsonText` to stable public export
- **`libraries/ts-extras/etc/ts-extras.api.md`** — regenerate
- **`rush.json`** — register `@fgv/ts-prompt-assist`
- **`common/changes/@fgv/ts-prompt-assist/`** + **`common/changes/@fgv/ts-extras/`** — rush change files
- **`.ai/instructions/LIBRARY_CAPABILITIES.md`** — new entries
- **`.ai/tasks/active/ts-prompt-assist/state.md`** — checkpoint updates (NQ-5 outcome; B.0–B.6 progression)

### Out-of-scope (this stream)

- SQL / Mongo store adapters (interface designed to admit them)
- Editor UI helpers (consumer concern)
- `FileTreePromptStore.watch` (stubbed `undefined`)
- `FileTreePromptStore.put` / `putBindings` / `delete` (read-only at v0.1)
- Schema-version migration (only `'1'` supported)
- Cross-scope body merging (bindings merge cross-scope; bodies don't)
- Resource bindings referencing `'json'`-output descriptors (rejected at resolve time)
- Post-render validators for `'free-text'` output (loader rejects descriptors that declare `outputValidations` on `'free-text'`)
- LLM-call orchestration
- Default anti-jailbreak text (library exposes the seam; consumer supplies content)
- Hot-reload via `watch?` on the FileTree adapter
- Samples app / generic editor UX (queued in `docs/FUTURE.md`)
- Sudoku packages

---

## Required reading (priority order)

1. `.ai/tasks/active/ts-prompt-assist/brief-phase-b.md` (this file) — binding phase B contract
2. `.ai/tasks/active/ts-prompt-assist/design.md` — locked design (binding)
3. `.ai/tasks/active/ts-prompt-assist/state.md` — phase A decision log + resolved/open questions
4. `.ai/tasks/active/ts-prompt-assist/design-brief.md` — original consumer-supplied design brief (background; superseded by `design.md` where they diverge)
5. `.ai/tasks/active/ts-prompt-assist/brief.md` — phase A binding contract (background)
6. `.ai/instructions/CODING_STANDARDS.md` — including the new "Extending Core Libraries Over Working Around Them" section (load-bearing for this stream's ts-extras + potentially ts-res additive extensions); pre-PR validation checklist
7. `.ai/instructions/TESTING_GUIDELINES.md` — 100% coverage discipline; Result matchers from `@fgv/ts-utils-jest`
8. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — confirms `ts-prompt-assist` and `ts-extras/mustache` + `/ai-assist` are appropriately treated (free hand on `ts-prompt-assist` v0.x; additive-only on the established `ts-extras/mustache` surface)
9. `.ai/instructions/LIBRARY_CAPABILITIES.md` — survey of existing primitives (FileTree, Result, Converters, MustacheTemplate, Hash, logging, ts-res qualifier collector + ResourceManager)
10. `libraries/ts-res/src/packlets/runtime/` — for NQ-5 audit (incremental add-after-build support)
11. `libraries/ts-res/src/packlets/resource-json/` — `ConditionSetDecl` + candidate decl converters (consumed by ts-prompt-assist's YAML schema per design §10.1)
12. `libraries/ts-res/src/packlets/qualifiers/convert.ts` — `qualifierDecl` Converter (consumed by ts-prompt-assist for `_qualifiers.yaml` loading)
13. `libraries/ts-extras/src/packlets/mustache/` — `MustacheTemplate` current shape (to extend additively)
14. `libraries/ts-extras/src/packlets/yaml/` — `yamlConverter<T>(inner)` (consumed by `FileTreePromptStore`)
15. `libraries/ts-extras/src/packlets/ai-assist/` — `extractJsonText` (to promote to public export)
16. `libraries/ts-json-base/src/packlets/file-tree/` — `FileTree.FileTreeItem` shape
17. `libraries/ts-app-shell/` and other recent new-library scaffolding (e.g. `libraries/ts-extras-argon2/`) — package.json / tsconfig / rig / eslint.config.js / api-extractor.json template

---

## Skills to load (when conditions trigger)

- `/result-pattern` — load before writing any function returning `Result<T>` (every public method)
- `/result-tests` — load before writing tests; use `@fgv/ts-utils-jest` matchers
- `/type-safe-validation` — load before designing Converters / Validators for the YAML schema and the registries
- `/filetree-io` — load before designing `FileTreePromptStore`; FileTree is canonical, not `node:fs`
- `/published-primitives-reflex` — load before writing any utility helper; check if a primitive already exists in `ts-utils` / `ts-extras` / `ts-res`
- `/ts-utils-logging` — load before designing the logger injection points
- `/value-hashing` — load before writing the resource-binding cycle-detection hash or the Mustache template cache key

---

## Branch + PR posture

- **Base branch:** `claude/ts-prompt-assist-features` (cluster integration branch — already exists; phase A merged into it)
- **Work branch:** `claude/ts-prompt-assist-phase-b` (or harness-auto-suffixed; document the actual branch in state.md)
- **PR target:** `claude/ts-prompt-assist-features` (NOT `release`)
- Single PR for all of B.0–B.6 is acceptable; multi-PR is also fine — implementer's choice
- Cluster's integration→release promotion happens AFTER consumer pressure-test absorbs any refinements (a separate follow-up stream); phase B is not responsible for the promotion PR

---

## Pre-PR gate (binding)

Per `CODING_STANDARDS.md` §Pre-PR Validation Checklist (and the lint-gate codification at #337):

- [ ] `rushx build` passes in `ts-extras` and `ts-prompt-assist`
- [ ] **`rushx lint` passes in `ts-extras` and `ts-prompt-assist`** (load-bearing — NOT transitively run by build)
- [ ] `rushx test` passes with 100% coverage in `ts-extras` and `ts-prompt-assist`
- [ ] `rushx fixlint` run before final commit (catches mechanical class)
- [ ] No `any`; no `console.*`; no `node:fs`; no `JSON.stringify`-compare; no `Result<void>`
- [ ] No inline `eslint-disable` directives added to make lint pass
- [ ] api-extractor regenerated (both `.api.md` files)
- [ ] `LIBRARY_CAPABILITIES.md` updated
- [ ] rush change files for both modified packages
- [ ] `state.md` records NQ-5 outcome + B.0–B.6 progression

---

## Don't

- Don't re-litigate phase A decisions. OQ-1 through OQ-6 are locked in `design.md` §2. NQs are resolved per `design.md` §15.6 / §16. If you find yourself wanting to revise a binding decision, **STOP and surface to the orchestrator**.
- Don't open the phase B PR until `rushx build && rushx lint && rushx test` all pass locally. Lint is a separate gate from build (see CODING_STANDARDS).
- Don't mutate `Mustache.escape` globally in the ts-extras mustache extension. Use a per-instance `Mustache.Writer` (per design §11.4 + OQ-6 implementation note).
- Don't add a separate `InMemoryPromptStore` class. Tests use `FileTreePromptStore` over an `InMemoryFileTree` via the `PromptStoreFixture.build(seed)` helper (per design §5.2).
- Don't add a `qualifierEnums` sub-registry. Qualifier config flows through ts-res directly per OQ-4 revised.
- Don't add a `compositionMode` field on `IPromptDescriptor`. Use ts-res's per-candidate `isPartial` (per design §10.2).
- Don't reimplement YAML parsing. Use `@fgv/ts-extras`'s `yaml.yamlConverter<T>(inner)`. No new direct `js-yaml` dep at the ts-prompt-assist level.
- Don't reinvent ts-res's `import` pipeline. `FileTreePromptStore` consumes lower-level primitives (`FileTree`, `yamlConverter`, ts-res `ResourceJson` converters) per design §15.
- Don't cache rendered prompt bodies / substituted bodies / post-validation outputs. ts-res's intrinsic caches (condition / conditionSet / decision) are the right cache level (per design §15.5 step 3). The parsed `MustacheTemplate` cache (parse cache) is separate and bounded by prompt-corpus body count.
- Don't pin a YAML parser version other than what `@fgv/ts-extras` already uses.
- Don't omit api-extractor / rush change file / LIBRARY_CAPABILITIES update; these are pre-PR gate items.

---

## Resume protocol

If the session ends mid-phase: read `brief-phase-b.md` (this file) + `design.md` + `state.md` to resume. State.md records which B.x sub-phases are complete; the NQ-5 verification outcome should be recorded there too.

---

## Missing-input rule

If a required-reading file is missing, conflicts with this brief, or you find a binding-rule conflict you can't resolve without orchestrator input (especially NQ-5's outcome if ts-res's runtime needs an extension larger than additive-cluster-scope), **STOP and report**. Do not improvise on binding decisions.
