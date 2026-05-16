# Stream Brief: ts-prompt-assist (phase B — implementation, restart)

**Stream ID:** ts-prompt-assist
**Phase:** B — implementation (restart after PR #359 retire)
**Cluster:** `ts-prompt-assist-features` (integration branch `claude/ts-prompt-assist-features`)
**Workflow shape:** design-triage-implement-refine, **decomposed into 5–6 scoped sub-phase agent runs** with clean handoffs (no carried context across sub-phases). Mid-run context drift was the failure mode of the first attempt; eliminating carried context is the structural fix.

> **Restart context.** PR #359 was retired without merge after ~35 reviewer-flagged issues (catalog in the PR's close comment and `design.md` §17). The corrections in `design.md` §17 (validator-chain redesign + NQ-5 resolution + guardrails) are binding for the restart. Phase B is decomposed into sub-phases B-0b through B-5; each sub-phase is a separate agent commission against a frozen state.

---

## Guardrails for the restart (binding — non-negotiable)

These are existing CODING_STANDARDS rules made **explicit and unmissable** because PR #359 demonstrated the failure modes are real when not enforced upfront. The implementing agent MUST adhere; if any of these come into tension with the task, **STOP and surface to the orchestrator** rather than improvising.

1. **No unsafe casts (`as T`, `as unknown as T`) in product code.** Test data may use `as unknown as BrandedType` for branded-type construction; product code must not. If the type system rejects what you're doing, **STOP and ask** — the data shape is wrong, you're missing a Converter / Validator, or the type definition needs refinement. Cast-driven typing is the failure mode this restart explicitly protects against.
2. **No `unknown` in product code without explicit rationale.** If reaching for `unknown` to bypass a type error, **STOP and ask**. `unknown` is legitimate at parse boundaries (JSON.parse result, untyped input from external sources) before a Converter narrows; it is not legitimate as a sustained internal type.
3. **Do not shadow types from `@fgv/*` libraries.** Use ts-res / ts-extras / ts-utils / ts-json-base types by their original import paths. If a type isn't exported where you need it, surface to the orchestrator — additive promotion in the upstream library is in scope per `CODING_STANDARDS.md` §"Extending Core Libraries Over Working Around Them". Recreating types locally is not.
4. **Do not ship unimplemented features as placeholders.** No `// not implemented in v0.1` returning empty strings, no `kind: 'resource'` silently returning the literal value, no stubbed methods that pretend success. If a sub-phase doesn't fit, **STOP and ask** — splitting into a separate PR on the integration branch is fine.
5. **Lint warnings are never "expected" or "pre-existing".** Fix them (`rushx fixlint` first, then manual). No inline `eslint-disable` directives added to make lint pass. See L15/L16 lessons-pending — silent lint bypass is a documented anti-pattern in this repo.
6. **Mandatory `code-reviewer` agent invocation** (Task tool, `subagent_type: code-reviewer`) before declaring any packlet complete. Apply the code-reviewer's findings before opening the PR; document any disagreement.
7. **PR target is binding** — `claude/ts-prompt-assist-features` integration branch, NOT `release`. Do not target release. Verify the base branch before pushing.
8. **Family-convention factory pattern** on every fallible class: `static create(...): Result<T>`. Even when the constructor doesn't currently throw — extension points matter and consumers expect the pattern.
9. **Code in `index.ts` is barrel-exports only.** Move all logic to dedicated files. Multiple PR #359 review flags hit this.
10. **Use Result chaining throughout.** `/result-pattern` skill load is mandatory; result-chained sequences read better than intermediate-variable cascades. Multiple PR #359 review flags pointed at "this would be more legible with result chaining" — that critique applies preemptively.

Read these guardrails before reading any other section. If a guardrail conflicts with what the design appears to require, **STOP and surface to the orchestrator** rather than improvising.

---

## Context

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

## Phase B sub-phase decomposition (binding — restart approach)

The restart decomposes phase B into **5–6 separate agent commissions**, each scoped to one sub-phase, with a clean handoff via `state.md`. Each agent starts cold against `design.md` + `state.md` + this brief — no carried context across sub-phases. PR #359 demonstrated that mid-run context drift across a single long agent run is a real failure mode; sub-phase decomposition is the structural fix.

**Each sub-phase is its own PR** to `claude/ts-prompt-assist-features`. Orchestrator reviews each PR before commissioning the next agent. Out-of-scope work surfaces to the orchestrator rather than expanding the current sub-phase.

| Sub-phase | Owner | Scope | Model | Notes |
|---|---|---|---|---|
| **B-0a — NQ-5 audit** | Orchestrator | Audit `ts-res/runtime` for incremental-add support; record outcome in state.md | n/a | **Done** (2026-05-16): ts-res's `ResourceManagerBuilder` natively supports `addLooseCandidate` / `addResource` / `addCondition` / `addConditionSet` post-construction and implements `IResourceManager` itself. Option C achievable with zero ts-res changes. See design.md §17.1. |
| **B-0b — ts-extras additive extensions** | Agent | `MustacheTemplate.create` `escape?: 'html' \| 'none' \| (s) => string` option (per-instance `Mustache.Writer`, no `Mustache.escape` global mutation); promote `extractJsonText` to stable public export from `@fgv/ts-extras/ai-assist`; rush change file for ts-extras. | Opus (small probe of new brief shape) | Small, isolated, well-defined. **Validates the restart brief** before committing to larger sub-phases. If this run is bad, we know early. Tests cover `'html'` (existing behavior unchanged), `'none'`, custom-function escape, and the promoted `extractJsonText` export. |
| **B-1 — Foundation** | Agent | Types + Converters for string-unions / branded scalars / discriminated unions + descriptor / bindings / qualifier-axis Converters + unified `IPromptRegistry<TResponse>` (per design §17.2) + chain walker + binding merger (cross-scope merge with `enforced` lock + `winningScope` trace) + Mustache render via B-0b `escape: 'none'` + InMemoryFileTree test fixture (`PromptStoreFixture.build(seed)`) + happy-path `PromptLibrary.resolve` returning full `IPromptResolveTrace`. **Stops short of** resource bindings, FileTreePromptStore disk path, output validation pipeline, input safeguards. | Opus (the make-or-break run; sets the foundation quality bar) | Largest sub-phase. The agent's foundation reads define what the follow-on sub-phases look like. Code-reviewer pass mandatory before PR. |
| **B-2 — Resource bindings** | Agent | Recursive resolver; cycle detection via `Hash.Crc32Normalizer.computeHash` on `(scopeChainHash, promptId)` pairs (NEVER `JSON.stringify`-compare); depth cap (default 5); OQ-2 strict-replace substitutions semantics with `'replace' \| 'inherit'` trace; full `innerTrace: IPromptResolveTrace` recursive surfacing in `IResourceBindingTraceEntry`. Sub-phase ends with resource bindings working against the InMemoryFileTree fixture (no FileTree disk path yet). | Sonnet (against working foundation) | Code-reviewer pass mandatory. |
| **B-3 — FileTreePromptStore + YAML loader** | Agent | `FileTreePromptStore.create` (read-only at v0.1: `get` / `list` / `getBindings` / `getQualifierConfig`; `watch?` undefined; `put` / `putBindings` / `delete` not implemented); YAML loading via `@fgv/ts-extras` `yaml.yamlConverter<T>(inner)` (no new `js-yaml` dep at ts-prompt-assist level); filename-id consistency check; double-brace rejection in descriptor Converter (body-token-scanner: rejects `tokenType === 'name'` **and** `tokenType === '&'` — both); `_qualifiers.yaml` root-level loading via ts-res's `qualifierDecl` Converter (do NOT shadow); smoke test against `FsTree`. | Sonnet | Code-reviewer pass mandatory. |
| **B-4 — Output validation pipeline + Input safeguards** | Agent | **Output (per design §8 + §17.2):** fence strip via `extractJsonText`; `JSON.parse`; resolve Converter by `output.converterId` (returns typed `T extends TResponse`); chain through `outputValidations[]` (each validator typed against `TResponse`; `appliesTo` narrows; runtime-fail safety net per §17.2.4); loader-side reject when validator `appliesTo` doesn't match Converter's declared response kind (belt). **Safeguards (per design §9):** per-slot length cap, regex screen (with `pattern.lastIndex = 0` reset for stateful flags), source-aware skipping, anti-jailbreak preface seam, full `safeguardFindings[]` surfacing including the `'enforced-override-ignored'` kind. | Sonnet | Combined since both are small post-resolve stages. Code-reviewer pass mandatory. |
| **B-5 — Docs + handoff package** | Agent | README in `libraries/ts-prompt-assist/` with quick-start (PromptLibrary + InMemoryFileTree fixture + tiny example) — the pressure-test handoff per design §12 criterion 15; TSDoc audit (every exported symbol); api-extractor `.api.md` regenerated for `ts-extras` and `ts-prompt-assist`; LIBRARY_CAPABILITIES.md updated with new entries (ts-prompt-assist library, `MustacheTemplate.create({escape})`, `extractJsonText` public export); rush change files for both modified packages. | Sonnet | Mechanical / documentation work. Last sub-phase. |

### Commissioning protocol

1. Each sub-phase agent's commission cites this brief + `design.md` + `state.md` and the **specific sub-phase row** that scopes the work.
2. Out-of-scope work is explicit (e.g., "B-2 does NOT touch the FileTreePromptStore disk path; if your work requires it, STOP and ask the orchestrator").
3. The agent's PR includes a state.md update marking the sub-phase done before merging.
4. Orchestrator reviews each PR; only after merge does the next sub-phase commission.
5. If a sub-phase agent surfaces a real cross-sub-phase dependency, the orchestrator may amend this brief OR resequence.

### Cross-sub-phase invariants (always binding)

- All sub-phase PRs target `claude/ts-prompt-assist-features` (NOT release).
- All sub-phase PRs pass `rushx build && rushx lint && rushx test` in all modified packages with 100% coverage on new code.
- All sub-phase PRs invoke the `code-reviewer` agent on completed packlets before opening the PR.
- All sub-phase PRs include rush change files for the packages they touch.
- No sub-phase ships unimplemented features as placeholders.
- See the 10 Guardrails above for the rest.

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

These are binding. Items marked **[PR #359]** call out specific failure modes from the retired attempt.

- Don't re-litigate phase A decisions. OQ-1 through OQ-6 are locked in `design.md` §2. NQs are resolved per `design.md` §15.6 / §16 / §17. If you find yourself wanting to revise a binding decision, **STOP and surface to the orchestrator**.
- Don't open any sub-phase PR until `rushx build && rushx lint && rushx test` all pass locally with 100% coverage on the sub-phase's surface. Lint is a separate gate from build (see CODING_STANDARDS).
- Don't target `release`. **[PR #359]** Sub-phase PRs target `claude/ts-prompt-assist-features` integration branch. Verify the base branch before pushing.
- Don't mutate `Mustache.escape` globally in the ts-extras mustache extension. Use a per-instance `Mustache.Writer` (per design §11.4 + OQ-6 implementation note + §17.4).
- Don't add a separate `InMemoryPromptStore` class. **[PR #359]** Tests use `FileTreePromptStore` over an `InMemoryFileTree` via the `PromptStoreFixture.build(seed)` helper (per design §5.2).
- Don't add a `qualifierEnums` sub-registry. Qualifier config flows through ts-res directly per OQ-4 revised.
- Don't add a `compositionMode` field on `IPromptDescriptor`. Use ts-res's per-candidate `isPartial` (per design §10.2).
- Don't reimplement YAML parsing. Use `@fgv/ts-extras`'s `yaml.yamlConverter<T>(inner)`. No new direct `js-yaml` dep at the ts-prompt-assist level.
- Don't reinvent ts-res's `import` pipeline. `FileTreePromptStore` consumes lower-level primitives (`FileTree`, `yamlConverter`, ts-res `ResourceJson` converters) per design §15.
- Don't cache rendered prompt bodies / substituted bodies / post-validation outputs. ts-res's intrinsic caches (condition / conditionSet / decision) are the right cache level (per design §15.5 step 3). The parsed `MustacheTemplate` cache (parse cache) is separate and bounded by prompt-corpus body count.
- Don't shadow types from `@fgv/*` libraries. **[PR #359]** `ConditionSetDecl`, `ILooseConditionDecl`, etc. are imported from ts-res; do NOT re-declare them. If a needed type isn't exported, surface to the orchestrator (additive promote upstream is in scope per CODING_STANDARDS).
- Don't ship unimplemented features as placeholders. **[PR #359]** No empty-string returns for resource bindings, no stubbed methods that "succeed" with nothing, no `// not implemented in v0.1` returning fake-success. If a sub-phase doesn't fit, STOP and ask.
- Don't use unsafe casts in product code. **[PR #359]** `as T`, `as unknown as T`, etc. signal a missing Converter / Validator or a wrong data shape. STOP and ask. (Test data may use `as unknown as BrandedType` for branded-type construction; product code may not.)
- Don't use `unknown` in product code without explicit rationale. **[PR #359]** Legitimate at parse boundaries (JSON.parse result) before a Converter narrows; not legitimate as a sustained internal type.
- Don't declare a logger in `ts-prompt-assist`. **[PR #359]** Use `Logging` from `@fgv/ts-utils`.
- Don't put logic in `index.ts`. **[PR #359]** Move to dedicated files; `index.ts` is barrel-export only.
- Don't dismiss lint warnings as "expected" or "pre-existing". **[PR #359]** Fix them. No inline `eslint-disable` directives added to make lint pass. See L15/L16 lessons-pending.
- Don't skip `code-reviewer` invocation before declaring a packlet complete. **[PR #359]** Mandatory per the 10 Guardrails above.
- Don't pin a YAML parser version other than what `@fgv/ts-extras` already uses.
- Don't omit api-extractor / rush change file / LIBRARY_CAPABILITIES update; these are pre-PR gate items.

---

## Resume protocol

If the session ends mid-phase: read `brief-phase-b.md` (this file) + `design.md` + `state.md` to resume. State.md records which B.x sub-phases are complete; the NQ-5 verification outcome should be recorded there too.

---

## Missing-input rule

If a required-reading file is missing, conflicts with this brief, or you find a binding-rule conflict you can't resolve without orchestrator input (especially NQ-5's outcome if ts-res's runtime needs an extension larger than additive-cluster-scope), **STOP and report**. Do not improvise on binding decisions.
