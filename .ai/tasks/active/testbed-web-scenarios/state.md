# State — `testbed-web-scenarios` (Phase A)

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
