# B-4a kickoff: ship the transformers facade

**Phase:** B-4a of `local-ai-exploration` (the **SHIP** branch of the done-or-discard gate)
**Integration branch:** `local-ai-exploration` (off `release`)
**Work branch:** `claude/local-ai-exploration-b4a`
**PR target:** `local-ai-exploration`, **NOT** `release` (cluster-close handles promotion)

---

## Why we're here

The B-3 done-or-discard gate decided **SHIP**: the facade read cleaner than raw `pipeline()`, the boundary survived a real composition, and Result/screener composition was natural. Review hardened the story further (the dual-target facade pattern below). B-4a polishes the two transformers facades to ship-quality and proves the boundary survives a **second model type**.

## Scope (four deliverables)

1. **`embed` primitive** in BOTH facades (`@fgv/ts-extras-transformers` Node + `@fgv/ts-web-extras-transformers` browser). Result-wrapped thin facade over `@huggingface/transformers` feature-extraction, mirroring the discipline of `loadPipeline`/`classify` (one-line `captureAsyncResult`, no opinionated orchestration). 100% coverage both packages.
2. **`classifyAll()` convenience** in BOTH facades — bakes `top_k: null` into the signature so the all-labels path is type-evident (closes the B-3 gap where `top_k: null` was a silent author-side contract). The B-3 classifier scenario should switch to `classifyAll()`.
3. **Embedding / semantic-search scenario** in `samples/testbed` (OQ-4: the different-model-type proof). Consumes `embed`; demonstrates a feature-extraction model (e.g. `Xenova/all-MiniLM-L6-v2`) producing vectors → cosine-similarity nearest-neighbour over a small in-scenario corpus. Dual web/CLI per the pattern below. 100% coverage; `build:web` must pass.
4. **`LIBRARY_CAPABILITIES.md` entries** for both facade packages (orchestrator will likely do this at close; agents may draft).

Plus: **change files** for every modified published package; **README "in scope / NOT in scope"** updates for the new primitives.

## The dual-target scenario pattern (MANDATORY — learned in B-3 review)

The testbed bundles for the browser (webpack, `src/web/index.tsx` entry, node modules stubbed). The B-3 review established the canonical pattern any dual web/CLI scenario MUST follow — the embedding scenario is **not** exempt:

- **Scenario core stays facade-agnostic.** Put the reusable logic (e.g. the embed→similarity ranking) in a pure unit that takes the facade function (`embed`) as an **injected parameter** and uses **type-only** facade imports (erased by webpack, pull no runtime facade into the bundle). See `samples/testbed/src/scenarios/localClassifierSafety/classifierScreener.ts` (`ClassifyFn` injection) as the reference.
- **Web path** imports the **browser** facade (`@fgv/ts-web-extras-transformers`).
- **CLI path** loads the **Node** facade via `import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers')` inside the `run()` body, so node-native deps never enter the web bundle's static graph.
- **`build:web` is a hard gate.** `heft build` (tsc) + `heft test` (jsdom, facade mocked) do NOT exercise the real browser bundle. You MUST run `webpack --mode production` (the `build:web` script) and confirm it compiles. B-3's facade defect was latent precisely because this gate was skipped.

## Facade-package note (context, not a task)

B-3 fixed a latent packaging bug in `@fgv/ts-web-extras-transformers`: its `exports` `.` default (browser) condition pointed at a never-emitted `lib/index.browser.js`; it now points at `lib/index.js` (the source is isomorphic — no separate browser build yet). If `embed`/`classifyAll` ever need browser-specific behaviour, that's a real `index.browser.ts` split + a `package.json` `exports` change — **stop and surface**, don't guess.

## Package / file surface (collision map)

In scope:
- `libraries/ts-extras-transformers/src/**` + tests + README + change file
- `libraries/ts-web-extras-transformers/src/**` + tests + README + change file
- `samples/testbed/src/scenarios/<embedding-scenario>/**` + registration in `scenarios/index.ts` + tests + change file
- `samples/testbed/src/scenarios/localClassifierSafety/**` (switch to `classifyAll()`)
- `.ai/instructions/LIBRARY_CAPABILITIES.md` (entries; orchestrator may own)
- `.ai/tasks/active/local-ai-exploration/state.md` + `phase-b4a-result.md` (ledger)

Do NOT touch: `@fgv/ts-prompt-assist`, `ts-app-shell`, any package outside the two facades + testbed (a change there is a stop-and-surface).

## Testing & mocking (mirror B-3)

- `jest.mock(...)` of the facade(s) as the FIRST statements (hoist-jest-mock rule). For the scenario tests, mock the **browser** facade for the component + `web.initialize`, and the **Node** facade (dynamic-import path) for the CLI `run()`.
- Pure core (the similarity/ranking unit) gets exhaustive unit tests with an injected mock `embed` returning canned vectors. No model download in tests.
- Component tested via `@testing-library/react` (jsdom IS available — do NOT blanket-`c8 ignore` the component; narrow honest defensive ignores only, per `conventions.md` §4).

## Acceptance gates (hard exit)

- [ ] `rush build` passes full repo
- [ ] `rushx lint` clean in every modified package (separate gate; run `rushx fixlint` first)
- [ ] `rushx test` 100% coverage all 4 metrics in every modified package
- [ ] **`build:web` (production webpack) compiles cleanly** — browser bundle verified, Node facade excluded
- [ ] No `any`; fallible ops return `Result<T>`; no `Result<void>`; no unsafe casts beyond branded test assertions
- [ ] Embedding scenario registered; appears in shell; follows the dual-target pattern
- [ ] B-3 classifier scenario switched to `classifyAll()`
- [ ] Change files for every modified published package
- [ ] `embed` + `classifyAll` documented in both READMEs (in-scope / NOT-in-scope lists)
- [ ] `LIBRARY_CAPABILITIES.md` entries added (or explicitly handed to orchestrator)
- [ ] `phase-b4a-result.md` written; `state.md` updated

## Stop-and-surface triggers

- The chosen embedding model id doesn't resolve as a transformers.js feature-extraction model, or its output shape doesn't fit a simple vector/cosine approach.
- `embed`'s upstream output type (Tensor vs nested array) doesn't compose cleanly into the similarity core — surface before casting around it.
- Either facade needs a genuine browser-specific build (an `index.browser.ts` + `exports` change) — that's a real packaging change, stop and surface.
- The dual-target pattern can't carry the embedding scenario for some reason — that's signal, surface it.

## Skills to load

| When | Skill |
|---|---|
| Writing the facade primitives / Result chains | `/result-pattern` |
| Writing tests | `/result-tests` |
| Before reaching for utility code | `/published-primitives-reflex` |
| Any file I/O (corpus fixtures) | `/filetree-io` |
| Emitting diagnostics | `/ts-utils-logging` |

## Execution shape (orchestrator-managed)

Commissioned in sequence on `claude/local-ai-exploration-b4a` (dependencies: scenario needs `embed`):
1. **Facade primitives** — `embed` + `classifyAll()` in both packages, tests, READMEs, change files.
2. **Embedding scenario** — dual-target, + switch B-3 scenario to `classifyAll()`, + `build:web`.
3. **Orchestrator** — `LIBRARY_CAPABILITIES.md` entries, final gate, PR to `local-ai-exploration`.
