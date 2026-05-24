# Stream state: `local-ai-exploration`

**Status:** ✅ cluster complete — B-1…B-5 merged (incl. #411); promotion PR → `release` open
**Integration branch:** `local-ai-exploration` (off `release`)
**Last updated:** 2026-05-24 (orchestrator — #411 merged; cluster-close: artifacts finalized, re-promotion PR up)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Research | ✅ complete | Local-model incorporation analysis at `.ai/notes/orchestrator/research/local-models-incorporation.md`. Recommendation: Option 2 (Result-shaped facade over `@huggingface/transformers`). Erik merged via #402 onto this branch. |
| B-1 — Scaffold | ✅ complete | PR #404. Three new packages registered, all gates green, 100% coverage on testbed. See `phase-b1-result.md`. |
| B-2 — Facade primitives | ✅ complete | PR #405. `loadPipeline` + `classify` shipped. `embed` + `generate` deferred. 100% coverage both packages. See `phase-b2-result.md`. |
| B-3 — First scenario (local classifier → IPromptSafetyPolicy) | ✅ merged | PR #408 (merged → local-ai-exploration as `d85a462e`). 100% coverage; web/Node facade split + `@fgv/ts-web-extras-transformers` `exports` packaging fix landed via review. See `phase-b3-result.md`. |
| **B-3 exit gate** | ✅ **SHIP** | All three done-or-discard criteria positive (facade cleaner than raw `pipeline()`; boundary survived a real composition; Result/screener composition natural). Hardened under review (dual-target facade pattern). Decision: ship → B-4a. See `phase-b4a-brief.md`. |
| B-4a — Ship the facade | ✅ merged | PR #409. `embed` + `classifyAll()` in both facades; `local-embedding-search` scenario (OQ-4 ✅); B-3 switched to `classifyAll()`; `LIBRARY_CAPABILITIES.md` entries. See `phase-b4a-result.md`. |
| ~~B-4b — Pivot to native~~ | ⬛ not taken | Gate decided ship; pivot path discarded. |
| B-5 — Shell + CLI scenario integration (+ ts-app-shell theme + UX styling) | ✅ complete (manual pass ✅) | Web shell mounts scenarios (initialize lifecycle + clickable sidebar); CLI `--scenario` dispatch. Gap-fix: shipped `@fgv/ts-app-shell` default light/dark theme (54-token CSS-var system + Tailwind preset); testbed consumes it (ThemeProvider + toggle; chrome + scenarios styled). Manual pass caught + fixed two browser-only bugs (transformers.js import.meta dev-overlay; embedding pipeline functional-updater crash). testbed 136 @ 100%, ts-app-shell 77 @ 100%, `build:web` clean. Functional + visual (light+dark) manual pass ✅ (Erik). PR #411. See `phase-b5-result.md`. |
| Cluster close (1st attempt) | ⬛ closed (#410) | Premature — promotion opened before B-5; closed and superseded. Buffer never advanced by its finalization commits. Re-promote after B-5. |
| Cluster close | 🟢 next | Promotion `local-ai-exploration` → `release` once B-4a PR merges. |

---

## Decisions log (orchestrator, substrate prep)

| Decision | Rationale |
|---|---|
| Build testbed + facade together; outcome-gated at B-3 | Erik (2026-05-22): "build the proposed AI surface; create a multi-scenario AI sample app; iterate until we're either happy with the code shape or decide to abandon it." Done-or-discard criteria locked at B-3 exit. |
| Testbed name: `samples/testbed` (not `samples/ai-sample`) | Erik (2026-05-22): "we might want to take 'ai' out of the name so we can use it for other fgv capabilities." Long-lived showcase app for all fgv capabilities, not AI-specific. |
| Web-first, CLI-secondary | Erik (2026-05-22): "prioritize web — the existing image samples are much harder to understand and work with via CLI." Some scenarios web-only by design (interactive React); CLI for batch-style or testable-from-pipeline. |
| Sample-browser UX framing | Erik (2026-05-22): "we probably want to think of the web UX as a sample browser and make sure the UX is prepared for that." Sidebar list + main area + collapsible (default-collapsed) message panel. |
| Manual scenario registration (no auto-discovery) | Erik (2026-05-22): "manual. dependencies etc already mandate changes for most consumers, so one more registration is not a barrier." |
| 100% coverage on testbed code | Repo standard; samples worth copying need to be trustworthy. Entry points (`cli.ts`, `web/index.tsx`) may be `c8 ignore`-d as orchestration glue. |
| Absorb `ts-prompt-assist-samples` FUTURE entry into testbed | Erik (2026-05-22) confirmed in design discussion. One general showcase that grows scenarios over time > two parallel demo apps. |
| Port existing `ai-image-gen-sample` scenarios → P3 tech debt | Erik (2026-05-22): "we should probably add tech debt to port the ai image scenarios over as well." Not in cluster scope; queued for after testbed is established. |
| Data pipeline = chocolate-lab pattern (checked-in generated TS) | Recon confirmed chocolate-lab's `data/published/<category>/*.yaml` → `scripts/build-library-data.js` → `src/packlets/built-in/builtInData.generated.ts` (checked in). Same shape; `rushx build:data` manual invocation. |
| KeyStore on web = `FileApiTreeAccessors.createFromLocalStorage` (existing ts-web-extras primitive) | Confirmed in chocolate-lab recon; primitive already exists. No new fgv extension required. Local helpers (`loadKeystoreFromTree`, etc.) stay app-local per chocolate-lab pattern. |
| First scenario: local classifier → `IPromptSafetyPolicy` backend | Simpler than RAG/routing scenarios; one model + one integration seam; concentrates on facade-to-ts-prompt-assist composition; abandons fast if facade reads wrong. |
| Tenet: gap-then-fix (preferred) OR workaround-with-tracked-workitem | Erik (2026-05-22) — load-bearing for the testbed-as-forcing-function role. Workaround comments tagged `// TESTBED-WORKAROUND:` (greppable). Tracked items go to `docs/TECH_DEBT.md` or `docs/FUTURE.md`. |
| Testbed rig: Heft dual-rig + webpack hybrid | B-1 implementing agent (2026-05-23) — `samples/ai-image-gen-sample` (named reference) uses webpack-only with no tests, incompatible with the 100%-coverage gate. Adopted `@fgv/heft-dual-rig` (same as `libraries/ts-app-shell`) so heft owns compile/lint/test/api-extractor and a sibling `webpack.config.js` builds the browser bundle. |
| c8-ignore scope: entry points + generated artifact only | B-1 implementing agent (2026-05-23) — `web/index.tsx` and the `if (require.main === module)` tail of `cli.ts` (orchestration glue with rationale comments), plus `src/generated/` (auto-generated). Everything else at 100% across all four metrics. |
| src layout: brief's nested form (web/ + cli.ts + shell/ + scenarios/ + generated/) | B-1 implementing agent (2026-05-23) — cleaner web/CLI separation than the flat `src/main.tsx` form `ai-image-gen-sample` uses. |
| **Done-or-discard gate → SHIP (B-4a)** | Orchestrator (2026-05-24) post-#408-merge. All three criteria positive; B-3 review additionally hardened the facade story (web/Node split via `webpackIgnore`, facade-agnostic screener, packaging-bug fix). No pivot signal. |
| Dual-target scenario pattern (canonical) | Established in B-3 review: screener/core stays facade-agnostic (injected fn + type-only imports); web path imports the browser facade; CLI path loads the Node facade via `import(/* webpackIgnore: true */ ...)`. B-4a's embedding scenario MUST follow this pattern. |
| B-4a second scenario = embedding/semantic-search (OQ-4 resolved) | Erik (2026-05-24): exercise a different model *type* (feature-extraction/embeddings, not another classifier) — strongest "boundary survives" evidence. Pulls the deferred `embed` primitive forward. |
| B-4a adds `classifyAll()` to both facades | Erik (2026-05-24): bake `top_k: null` into the signature so the all-labels path is type-evident (the B-3 gap). B-3 classifier scenario should switch to it. |

---

## Open questions

### To resolve at sub-phase brief-authoring time

| ID | Question | Phase |
|---|---|---|
| OQ-1 | Exact facade surface (5-8 ops): naming, signature, browser vs Node behavior differences | B-2 sub-brief |
| OQ-2 | Whether `loadPipeline` returns an opaque type or a thin Result-wrapped reference to the upstream `Pipeline` | B-2 sub-brief |
| OQ-3 | Whether the testbed's web shell should support keyboard shortcuts for scenario navigation (ts-app-shell `keyboard` packlet is available) | B-1 sub-brief |
| ~~OQ-4~~ | ✅ Resolved (2026-05-24): yes — B-4a lands an **embedding/semantic-search** scenario (different model type) to confirm the boundary survives. See decisions log. | ~~B-3 exit gate~~ |

### Deferred (not this cluster's concern)

| ID | Question | Where it lives |
|---|---|---|
| F-1 | Port `samples/ai-image-gen-sample` scenarios into testbed | `docs/TECH_DEBT.md` (this cluster files the entry) |
| F-2 | Editor UX as a separate `ts-prompt-assist-editor-ui` stream | `docs/FUTURE.md` (already queued; unchanged) |
| F-3 | Sidecar/HTTP local LLM path (Ollama/LM Studio via existing ai-assist baseUrl) | Documentable independent of this cluster (research note surprise #1); flagged for a separate small chore PR if Erik wants |

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-19 | Research note authored | `.ai/notes/orchestrator/research/local-models-incorporation.md` via #402; recommended Option 2 with timing "next slot, not urgent." |
| 2026-05-22 | Erik merged research to `local-ai-exploration` branch; commissioned the build-and-evaluate journey | "Build the proposed AI surface; create multi-scenario sample app; iterate until happy or abandon." |
| 2026-05-22 | Substrate prep | Brief + state + WORKSTREAMS + FUTURE absorbs + TECH_DEBT entry for ai-image port. PR #403. |
| 2026-05-23 | B-1 scaffold complete | Three new packages (`@fgv/testbed`, `@fgv/ts-extras-transformers`, `@fgv/ts-web-extras-transformers`) scaffolded empty-but-compilable. Rig + c8-scope + src-layout decisions locked via AskUserQuestion pre-scaffold. 100% coverage on testbed. PR #404. See `phase-b1-result.md` for scaffolding surprises carried into B-2. |
| 2026-05-23 | B-2 facade primitives complete | `loadPipeline` + `classify` implemented in both transformers packages. `embed` + `generate` deferred. 100% coverage (13 tests each). `@huggingface/transformers` added as runtime dep. `skipLibCheck` required for upstream type-def issues. See `phase-b2-result.md`. |
| 2026-05-24 | B-3 merged (#408) + gate decided | First scenario merged as `d85a462e`. Review drove the web/Node facade split, a facade-agnostic screener core, and a packaging-bug fix in `@fgv/ts-web-extras-transformers` (`exports` browser target). Done-or-discard gate → **SHIP**. B-4a commissioned. |
| 2026-05-24 | B-4a implemented | `embed` + `classifyAll()` shipped in both facades (23 tests each, 100%); `local-embedding-search` scenario added + B-3 switched to `classifyAll()` (testbed 111 tests, 100%, `build:web` clean); `LIBRARY_CAPABILITIES.md` entries; full `rush build` green. Two implementing agents (facade primitives; scenario) + orchestrator (caps doc, gates). OQ-4 answered yes. See `phase-b4a-result.md`. |
| 2026-05-24 | B-4a review (#409) | Three review rounds (Copilot + Erik) addressed on-branch: Result chaining, doc-accuracy corrections, definitive `c8 ignore` rationales, honest test-mock typing. Gates re-run green each round. Erik to merge. See `phase-b4a-result.md` § Review. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Research | #402 | merged to `local-ai-exploration` |
| Substrate prep | #403 | merged to `local-ai-exploration` |
| B-1 | #404 | merged to `local-ai-exploration` |
| B-2 | #405 | merged to `local-ai-exploration` |
| B-3 | #408 | ✅ merged to `local-ai-exploration` (`d85a462e`) |
| B-4a | (PR pending) | open on `claude/local-ai-exploration-b4a` → `local-ai-exploration` |
