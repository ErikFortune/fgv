# State — `testbed-web-scenarios`

## Phase B — generic web runner (this section)

### Status
Implementation + tests complete, 100% coverage, `rushx build`/`lint`/`test`/`build:web` all
green. Layer-1 `code-reviewer` pass run on the final diff; findings resolved/dispositioned
below. PR open against `release`; Copilot loop in progress.

### What shipped

- **`shell/index.ts`**: additive `ICliScenarioImpl.webRunnable?: boolean`. Absent/false =
  current CLI-only behavior; `true` (with no `web` impl) opts the scenario into the shell's
  generic runner panel.
- **`web/ScenarioRunnerPanel.tsx`** (new): the shell-generic runner panel. Resolves each
  `requiredSecrets` entry via `context.resolveSecret` (loading/ready/missing status per spec,
  "Open Secrets (top bar)" affordance on missing — mirrors Phase A's `ChatSettingsPanel`
  pattern), a Run button (disabled while in flight), an elapsed-time ticker, and the
  `Result<string>` report (monospace `<pre>` on success, `status-error` styling on failure).
  Mirrors `aiProviderSecrets.ts`'s `useProviderApiKey` for the re-resolve-on-identity-change
  pattern and `App.tsx`'s `ScenarioHost` for the mounted-guard / effect-cleanup pattern.
- **`web/App.tsx`**: `ScenarioHost`'s lifecycle state machine gained a `'runner'` state —
  when `!scenario.web && scenario.cli?.webRunnable === true`, renders `ScenarioRunnerPanel`
  instead of the CLI-only "no-web" panel. No change to the `web`-impl or plain-CLI paths.
- **Nine scenarios opted in** (`webRunnable: true`), each verified browser-clean via
  `rushx build:web` (no Node-core/Node-native static imports) and switched from direct
  `process.env` reads to `context.resolveSecret` (required — browsers have no
  `process.env`, and `rushx build:web`'s webpack config deliberately has no Node-core
  fallback stubs, so a leaked Node-only *import* fails the build, but a bare `process.env`
  *reference* only throws at runtime, so this needed a manual audit, not just the build gate):
  - `anthropic-client-tools`, `openai-client-tools`, `gemini-client-tools`,
    `xai-client-tools`: switched from `process.env.<X>_API_KEY` to
    `resolveProviderApiKey(context, providerId)` (the existing Phase A helper in
    `aiProviderSecrets.ts` — no new secret ids invented).
  - `gate-deny-client-tools`: no secrets; the only change was `global.fetch` →
    `globalThis.fetch` for the mocked-stream setup (`global` is a Node-only identifier —
    absent in a browser bundle — while `globalThis` is universal and behaves identically
    on Node, since `globalThis === global` there).
  - `openai-model-tiers`, `anthropic-model-tiers`, `google-gemini-model-tiers`: replaced
    the env-var-list lookup inside the c8-ignored `buildLiveComplete` live-completion seam
    with a new exported, directly-tested `resolveTierApiKey(context, specs)` that walks
    `context.resolveSecret` over the scenario's own `requiredSecrets` (first success wins).
  - `cross-provider-embedding-search`: the scenario's config parser
    (`parseEmbeddingScenarioConfig`) is env-driven with several non-secret CLI-only knobs
    (`EMBED_PROVIDER`/`EMBED_MODEL`/`EMBED_DIMENSIONS`/`EMBED_ENDPOINT` — no per-scenario
    config UI exists in the generic runner panel). Added `readNodeEnv()` (reads `process`
    off `globalThis` via property access, never a bare identifier, so it resolves to `{}`
    in a browser instead of throwing) and `resolveKeyOrEnvFallback()` (resolves the
    provider key via `context.resolveSecret`, falling back to the CLI env value). The
    browser run always exercises the default (openai, no dimension/endpoint override)
    path; noted in the scenario description.

### Browser-cleanliness verdicts (per the brief's candidate list)

| Scenario | Verdict | Notes |
|---|---|---|
| `anthropic-client-tools` | Opted in | Clean import graph; `resolveProviderApiKey` swap for secrets. |
| `openai-client-tools` | Opted in | Same. |
| `gemini-client-tools` | Opted in | Same. |
| `xai-client-tools` | Opted in | Same. |
| `gate-deny-client-tools` | Opted in | No secrets; `global.fetch` → `globalThis.fetch` fix. |
| `openai-model-tiers` | Opted in | `resolveTierApiKey` swap; `build:web` clean. |
| `anthropic-model-tiers` | Opted in | Same. |
| `google-gemini-model-tiers` | Opted in | Same. |
| `cross-provider-embedding-search` | Opted in | `readNodeEnv`/`resolveKeyOrEnvFallback`; browser run is openai-default-only. |
| `sqlite-vec-memory-persistence` | **Not opted in** | Excluded per brief (`better-sqlite3` native binding). |
| `sqlite-vec-fragment-persistence` | **Not opted in** | Excluded per brief (same). |
| `mcp-probe` | **Not opted in** | Excluded per brief (`@fgv/ts-extras-mcp` stdio transport spawns subprocesses). |
| `local-summarization` | **Not opted in** | Excluded per brief (Node transformers facade, `webpackIgnore` dynamic import). |
| `memory-tools-gate` | **Not opted in** | Not on the required list; not verified this phase (also has the `global.fetch` pattern and a `@fgv/ts-agent-memory` import graph not audited for browser-cleanliness) — left CLI-only per "if in doubt, leave it out." |

### Layer-1 `code-reviewer` summary

Ran the `code-reviewer` agent twice on the final diff (two independent passes, both via
the Agent tool, both returned via the async completion-notification path rather than a
synchronous tool result — an environment quirk, not a process skip). Both passes
**Approved**, no P1 findings.

- **P2-1 (fixed):** the "process absent" browser-simulation test in
  `crossProviderEmbeddingSearch.test.ts` deleted/restored `globalThis.process` without a
  `try/finally`, so a thrown setup error between delete and restore could leak the
  deletion into later tests in the file. Wrapped the setup + `cli.run(...)` invocation in
  `try { ... } finally { globalThis.process = originalProcess; }`.
- **P2-2 (fixed):** `App.tsx`'s new `'runner'` lifecycle branch in `ScenarioHost` was only
  *incidentally* covered — the 100% coverage number came from the generic full-registry
  smoke test happening to land on a `webRunnable` scenario first, not from a dedicated
  assertion. Added two direct tests in `App.test.tsx` mirroring the existing `'no-web'`
  test: one confirming `ScenarioRunnerPanel` renders when `cli.webRunnable === true` and
  no `web` impl, one confirming the `'no-web'` panel still renders when
  `cli.webRunnable === false`.
- **P2-3 (dispositioned, not fixed):** `crossProviderEmbeddingSearch`'s browser path only
  resolves `gemini-api-key` (not a `google-api-key` fallback, unlike
  `aiProviderSecrets.ts`'s `PROVIDER_SECRET_SPECS`). Impact is zero today — `EMBED_PROVIDER`
  is a CLI-only knob and the browser run always defaults to `openai` (documented in the
  scenario's own doc comment) — so the Gemini branch is unreachable from the web runner
  panel regardless. Left as a follow-up if `EMBED_PROVIDER` selection ever becomes
  browser-configurable.
- **P3 items** (duplicated secret-resolution shapes across `resolveProviderApiKey` /
  `resolveTierApiKey` / `resolveKeyOrEnvFallback`; a doc-comment precision nit on
  `readNodeEnv`; the `cli` tag left on `cross-provider-embedding-search` despite being
  web-runnable now): noted, not fixed — genuinely different fallback semantics per call
  site, and no functional impact. Candidates for a future consolidation pass if a fourth
  consumer of the same shape shows up.

All fixes verified: `rushx build` / `lint` / `test` (100% branches/lines/functions/statements)
/ `build:web` all green after applying both fixes.

### Runbook (for the PR description)

**Without any keys configured:**
1. Open the testbed web app, select any of the 9 web-runnable scenarios from the sidebar.
2. The runner panel shows each required secret as "not set — Open Secrets (top bar) to add
   one" (or "requires no secrets" for `gate-deny-client-tools`).
3. Click Run. `gate-deny-client-tools` (mocked stream, no live API) succeeds regardless.
   The other 8 fail immediately with a clear "Secret '<id>' is not set…" diagnostic —
   no crash, no hang.

**With keys configured (via the Secrets modal, top bar):**
1. Paste a provider key into the relevant field(s); the runner panel's secret status
   flips to "configured" within a render (re-resolves on the session-secrets-store
   identity change).
2. Click Run — button disables, shows "Running…" + a ticking elapsed-seconds readout.
3. On completion: success renders the scenario's `Result<string>` report in a monospace
   block; failure (e.g. a CORS-restricted provider, or a live API error) renders in the
   error-styled block. Known CORS caveat: provider descriptors carry
   `streamingCorsRestricted`/similar flags; a scenario that fails for CORS reasons in the
   browser is an accepted, loudly-surfaced outcome per the brief (not a bug in this
   stream).

### Open questions / follow-ups

- `memory-tools-gate`'s browser-cleanliness was not verified this phase (see table above).
  A future pass could audit its `@fgv/ts-agent-memory` import graph and fix its
  `global.fetch` reference if it's worth opting in.
- The `cross-provider-embedding-search` browser run only ever exercises the default
  OpenAI path (no per-scenario config UI to select `EMBED_PROVIDER=gemini` etc. from the
  browser) — acceptable per the brief's "no bespoke per-scenario UI" constraint, but a
  future generic "advanced knobs" affordance on the runner panel could close this gap if
  Erik wants full parity.

---

# Phase A (below)

## Status
Implementation + scenario-driven tests complete. About to run layer-1 `code-reviewer`
pass before closing remaining coverage gaps (per TESTING_GUIDELINES sequencing).

## What shipped

### Shell secret story (`samples/testbed/src/shell/`)
- `secretResolver.ts`: replaced the B-1 stub with a real implementation. Resolution
  order: unlocked KeyStore (if present and holds the secret) → session-memory secrets
  map (new, optional `sessionSecrets` param) → env-var fallback. `keyStore` stays
  `undefined` on both web and CLI in this phase (per brief design decision 1); the
  KeyStore branch is honored because the param already existed, not newly added.
- `sessionSecretsStore.ts` (new): `dedupeRequiredSecrets(scenarios)` (pure, dedupes
  `requiredSecrets` across the registry by id) and `useSessionSecretsStore()` (React
  hook holding a `ReadonlyMap<string,string>` in state; `setSecret` produces a new Map
  identity on every update — this identity change is the reactivity signal scenario
  effects key off via `context.resolveSecret`'s closure identity).
- Both re-exported from the `shell/index.ts` barrel (matching the existing
  barrel-only-import convention observed across the package).

### Web shell mount (`samples/testbed/src/web/`)
- `SecretsModal.tsx` (new): renders `@fgv/ts-app-shell`'s `Modal` listing one field per
  deduped required secret (session-memory only, explicit no-persistence copy in the
  modal body).
- `App.tsx`: added a "Secrets" button to the top bar (opens the modal), wired
  `useSessionSecretsStore()` into `TestbedShell`, and rewired `scenarioContext.resolveSecret`
  to pass `sessionSecrets: secrets` with `secrets` in the `useMemo` deps (so the
  `resolveSecret` closure identity changes whenever a secret is saved). Removed the two
  stale `/* c8 ignore */` comments referencing the B-1 stub (now real code paths, both
  covered by tests).
- `cli.ts`: removed a stale `c8 ignore` comment on the `getEnvVar` callback (now a real,
  exercised path — the CLI's `resolveSecret` call already passed `getEnvVar` before this
  phase, but it never had an effect until the stub was replaced).

### Two new scenarios
- `scenarios/aiProviderSecrets.ts` (new, shared by both scenarios): `PROVIDER_SECRET_SPECS`
  maps `AiAssist.AiProviderId` → the *existing* CLI secret ids (`openai-api-key`,
  `anthropic-api-key`, `gemini-api-key`/`google-api-key`, `xai-api-key` — verified against
  `modelTiers/index.ts` and the `*ClientTools` scenarios, no new ids invented).
  `requiredSecretsForProviders`, `resolveProviderApiKey`, `SingleSecretKeyStore` (a
  from-scratch re-implementation of the sample's `InMemoryKeyStore` shape — the sample
  itself is untouched, per the brief), and `useProviderApiKey` (a hook that resolves +
  tracks the current provider's key, re-resolving on provider change or on
  `context.resolveSecret` identity change).
- `scenarios/imageGeneration/` (`index.tsx`, `SettingsPanel.tsx`, `PromptPanel.tsx`,
  `ImageResults.tsx`): web-only port of the sample's image mode. **No CLI** (a live key
  can't be embedded in the CLI's non-interactive run, and the sample itself has no CLI
  surface). No per-scenario API-key input — `SettingsPanel` shows a "no key configured —
  open Secrets" affordance instead, per design decision 3.
- `scenarios/streamingChat/` (`index.tsx`, `SettingsPanel.tsx`, `ChatPanel.tsx`,
  `promptLibrary.ts`): web-only port of the sample's chat mode + the `ts-prompt-assist`
  tone demo (near-verbatim port of `promptLibrary.ts`). Same no-per-scenario-key-input
  pattern.
- Both registered in `scenarios/index.ts`.

## Surprises / deviations from the sample

1. **The `ai-assist` image-generation API has moved on since the sample was written.**
   The sample (`samples/ai-image-gen-sample`) builds via `webpack --mode production`
   with `babel-loader` only — no `tsc` type-check step — so it silently went stale
   against the current `IAiImageGenerationOptions` shape. Concretely: `.imagen` (the
   field the sample uses for aspect ratio) no longer exists, `'gemini-imagen'` is no
   longer a valid `AiImageApiFormat` (replaced by `'gemini-image-out'`), and
   `GptImageSize` dropped the DALL-E-3-era `'1024x1792'`/`'1792x1024'` values in favor of
   `'1024x1024' | '1536x1024' | '1024x1536' | 'auto'`. The ported `PromptPanel.tsx` uses
   the **current** layered-options API instead of a line-for-line port: OpenAI sizing
   stays a top-level `options.size`; Gemini Flash Image and xAI Grok Imagine aspect
   ratio now go through `options.models: [{ provider, family, config: { aspectRatio } }]`
   blocks. This is a necessary adaptation for testbed (which *does* type-check on
   `rushx build`), not scope creep — I did not touch the sample itself. Flagging for
   Erik: the sample itself would fail a real `tsc` pass today and may be worth a
   separate follow-up (not this stream — out of scope per the brief, "do not modify the
   sample").
2. **Dropped the `provider` prop from the ported `PromptPanel`** — it existed in the
   sample only to print a "dall-e-3 only accepts 1" hint, which is stale given the
   #568 rotation (gpt-image-2, not dall-e-3). Replaced with a capability-driven
   `maxCount` hint instead, which is correct for whatever model is actually resolved.
3. **No secrets-modal `openSecrets()` context callback.** The design decision 3 wants a
   "missing key — open Secrets" affordance; I implemented it as static text pointing at
   the top-bar button rather than adding a new `IScenarioContext` field to
   programmatically open the modal. Simpler, and the Sequencing note's bar
   ("`resolveSecret` unchanged is enough for the Phase B runner") is satisfied either
   way — this is a UX-only choice, easy to upgrade to a callback later if Erik wants
   one-click affordance instead of "look at the top bar".
4. **`SingleSecretKeyStore` + `useProviderApiKey` are shared** between the two new
   scenarios (`scenarios/aiProviderSecrets.ts`) rather than duplicated — both scenarios
   need identical "resolve the current provider's key, rebuild a one-entry
   `IAiAssistKeyStore` adapter" logic.

## Test coverage status (pre-code-reviewer)

Full `rushx test` run: 380 passed, 0 failed.
- `shell/`, `web/App.tsx`, `web/SecretsModal.tsx`, `scenarios/aiProviderSecrets.ts`: 100%.
- `scenarios/imageGeneration/*`: ~98% statements, ~80% branches.
- `scenarios/streamingChat/*`: ~96% statements, ~78% branches.
- Aggregate: 99.31% stmts / 94.2% branches / 96.55% funcs / 99.31% lines.

Remaining gaps are mostly defensive branches (unmount guards, `?? undefined` fallbacks
already covered elsewhere) — will categorize properly in the coverage-closure pass
*after* the code-reviewer pass, per the load-bearing TESTING_GUIDELINES ordering.

## Open questions / follow-ups for the orchestrator

- Whether to retire `samples/ai-image-gen-sample` is explicitly Erik's call after
  validating parity (brief decision 4) — not touched.
- The sample's own type drift (see surprise #1) might warrant a separate small fix
  stream so `rushx build` (if ever added to its scripts) wouldn't immediately fail;
  raising as a FYI, not filing it myself since it's outside this stream's declared
  surface.
- Phase B (generic web runner) is next, per the brief's sequencing note. The
  `resolveSecret`/session-secrets-store shape should be consumable unchanged by a
  runner panel since scenarios only ever go through `context.resolveSecret`.
