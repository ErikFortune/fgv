# Stream brief — `testbed-web-scenarios` Phase B: generic web runner for CLI scenarios

**Commissioned:** 2026-07-26, immediately after Phase A merged (#569, squash `f9ba0797`). Erik wants to publish within hours — keep scope tight, land clean.
**Branch:** `testbed-web-runner` off `release` @ `f9ba0797`.
**Backlog anchor:** `docs/FUTURE.md` "Web-runnable CLI scenarios in `samples/testbed`".

## Mission

Let browser-compatible CLI scenarios run from the testbed web UI: an opt-in per-scenario flag plus a shell-provided generic runner panel that executes the scenario's existing `run` logic in-browser, streams its logging to the StatusBar, and renders the `Result<string>` report. No bespoke React component per scenario.

## Ground truth (post-Phase-A)

- Phase A landed the web secret story: session-memory secrets store + Secrets modal; `resolveSecret` works on web (KeyStore → session secrets → env). Scenarios already declare `requiredSecrets` with shared ids (`aiProviderSecrets.ts`, `modelTiers/index.ts`).
- Shell contract in `samples/testbed/src/shell/index.ts`: `IScenario = IScenarioBase & { web?, cli? }`; `ICliScenarioImpl.run(context) → Promise<Result<string>>`. The web shell (`src/web/App.tsx`) renders a "CLI-only" panel for scenarios without `web`.
- `IScenarioContext` is surface-agnostic (logger, keyStore, resolveSecret, dataTree) — a CLI `run` that only uses the context and browser-safe imports can execute in the browser as-is.
- Node-bound scenarios use `webpackIgnore` dynamic imports inside `cli.run` (better-sqlite3, Node transformers facade, MCP stdio). Those must NEVER be executed in the browser.

## Design decisions (locked)

1. **Opt-in flag, not autodetection.** Add an additive optional field to the scenario contract — `readonly webRunnable?: boolean` on `ICliScenarioImpl` (or an equivalent explicit marker; keep it on the CLI impl since it qualifies that impl). Default absent = current behavior (CLI-only panel). A scenario with its own `web` impl is unaffected.
2. **Shell-generic runner panel.** When the active scenario has `cli.webRunnable === true` and no `web` impl, the shell renders a runner panel instead of the CLI-only message: scenario description, missing-secret status (from `requiredSecrets` via `resolveSecret` — with an "open Secrets" affordance mirroring Phase A's pattern), a Run button, a running state (disable re-entry; show elapsed/spinner), and on completion the `Result<string>` report in a monospace `<pre>` block (success) or the failure message in the error styling. Logger output already lands in the StatusBar via the shell context — that's sufficient; do not build a bespoke log pane.
3. **Which scenarios opt in (exactly these, initially):**
   - `anthropic-client-tools`, `openai-client-tools`, `gemini-client-tools`, `xai-client-tools`, `gate-deny-client-tools`
   - `openai-model-tiers`, `anthropic-model-tiers`, `google-gemini-model-tiers`
   - `cross-provider-embedding-search`
   Verify each candidate's module graph is browser-clean before opting it in (no static Node-core/Node-native imports; `build:web` is the proof — the webpack config deliberately has NO fallback stubs, so a leak fails the build). Do NOT opt in: the two sqlite-vec scenarios, `mcp-probe`, `local-summarization` (Node facade), `memory-tools-gate` unless you verify its graph is genuinely browser-safe — if in doubt, leave it CLI-only and note it in state.md.
   - CORS caveat: provider descriptors carry flags like `streamingCorsRestricted`; the client-tools/tier canaries make direct provider calls that generally work from the browser (the Phase A chat scenario proves the pattern for Anthropic/OpenAI/Gemini/xAI). If a specific scenario fails in-browser for CORS reasons at runtime, that is acceptable for this phase — the runner surfaces the failure Result loudly; note known-restricted cases in the scenario description rather than blocking the stream on it.
4. **No contract breaks.** Everything is additive: new optional field, new shell panel. CLI behavior unchanged. `ai-image-gen-sample` untouched.

## NOT in scope

- Running scenarios with Node-only paths in the browser (no polyfills, no stubs — repo rule).
- Persistent/encrypted KeyStore; changes to the secrets model.
- Retiring `ai-image-gen-sample`.
- Library (`@fgv/*`) changes — expected none; if a genuine gap appears, STOP and report.

## Acceptance criteria

- [ ] `rushx build` / `rushx lint` / `rushx test` (100% coverage) / `rushx build:web` green in `samples/testbed`; `rushx fixlint` before final commit
- [ ] No `any`; Result pattern; no console.* in app code (use the injected logger)
- [ ] Opted-in scenarios render the runner panel with secret status; non-opted CLI scenarios keep the current CLI-only panel; web-impl scenarios unaffected
- [ ] Runner handles: missing secrets (pre-run status, not a crash), in-flight state, success report, failure message
- [ ] `code-reviewer` on the final diff BEFORE coverage closure; findings resolved/dispositioned
- [ ] `state.md` updated (Phase B section) — including the browser-cleanliness verdict per candidate scenario
- [ ] PR to `release`; layer-1 summary + runbook (which scenarios to click, expected behavior with/without keys); Copilot loop to diminishing returns; DO NOT merge
