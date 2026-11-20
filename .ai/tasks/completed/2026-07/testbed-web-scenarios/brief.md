# Stream brief — `testbed-web-scenarios` (Phase A: image-scenario port + web secrets)

**Commissioned:** 2026-07-26 (Erik: "Okay, 568 is merged. Let's land those two scenarios.")
**Branch:** `testbed-web-scenarios` off `release` @ `a57045d9` (post-#568 model rotation).
**Backlog anchors:** `docs/TECH_DEBT.md` "[P2] Port `samples/ai-image-gen-sample` scenarios into `samples/testbed`" + `docs/FUTURE.md` "Web-runnable CLI scenarios in `samples/testbed`" (Phase B — NOT this phase; see Sequencing).

## Mission

Port the two `samples/ai-image-gen-sample` scenarios — **image generation** and **streaming chat (with the ts-prompt-assist tone demo)** — into `samples/testbed` as `IScenario` web implementations, wiring the testbed shell's web-side secret story that both this port and the future web-runner phase depend on.

## Ground truth (recon done — trust this, verify cheaply)

- **Shell contract** (`samples/testbed/src/shell/index.ts`): `IScenario = IScenarioBase & { web?, cli? }`. `IScenarioBase.requiredSecrets?: ISecretSpec[]` is *already documented* as "surfaced in the secrets modal" — the modal was anticipated but never built. `IScenarioContext` carries `keyStore: KeyStore | undefined` (web passes `undefined` — B-1 stub), `resolveSecret(spec)` (KeyStore-first, env-var fallback via `shell/secretResolver.ts`), `logger`, `dataTree`.
- **Web shell** (`samples/testbed/src/web/App.tsx`): builds the context with `keyStore: undefined` and a `resolveSecret` that can only see env vars (i.e. nothing, in a browser). Sidebar lists all scenarios; no-web scenarios get a CLI-only panel.
- **Existing web scenarios** (`localClassifierSafety`, `localEmbeddingSearch` — both `index.tsx`): the only two with `web` impls; use them as the component/initialize pattern reference.
- **Image sample** (`samples/ai-image-gen-sample/src/`): `App.tsx` (427 lines, two modes: `image` | `chat`), `components/SettingsPanel.tsx` (provider picker + API-key input + model picker + listModels fetch), `PromptPanel.tsx`, `ImageResults.tsx`, `ChatPanel.tsx` (streaming chat), `promptLibrary.ts` (ts-prompt-assist tone demo, typed `qualifierNameConverter`), `inMemoryKeyStore.ts` (33-line `InMemoryKeyStore implements AiAssist.IAiAssistKeyStore` — session-memory secrets, typed once per session). Uses `useAiAssist` from `@fgv/ts-app-shell` and `AiAssist.supportsImageGeneration` / `resolveModel(descriptor.defaultModel, 'image' | 'base')` (the model picker pre-fills from the rotated tiers — preserve this; it's the live rotation validator).

## Design decisions (locked)

1. **Web secrets = session-memory + shell-level secrets UI.** Port the `InMemoryKeyStore` pattern up into the testbed shell as a session secret source: a shell-owned secrets modal/panel (opened from the top bar) that lists the union of `requiredSecrets` across registered scenarios (grouped by scenario or deduped by id — implementer's call, dedupe leans cleaner since provider keys are shared), lets the user paste values, and holds them in React state for the session. The web `resolveSecret` consults this store first (then env fallback, which is a no-op in browsers). **Do NOT build a password-encrypted persistent KeyStore in this phase** — `keyStore` stays `undefined`; `resolveSecret` is the seam scenarios use. Persistent/encrypted storage is a possible future extension, not Phase A.
2. **Scenarios declare their keys via `requiredSecrets`** using the SAME secret ids the CLI scenarios already use (`openai-api-key`/`OPENAI_API_KEY`, `anthropic-api-key`, `gemini-api-key`/`google-api-key`, `xai-api-key` — check `modelTiers/index.ts` for the exact existing specs and reuse them; do not invent parallel ids).
3. **Two new scenarios**, registered in `scenarios/index.ts`:
   - `image-generation` (category `ai`): port of the sample's image mode — provider picker (image-capable providers), model picker pre-filled from the `image` tier, prompt, generated-image results. Web-only (`web` impl, no `cli`).
   - `streaming-chat` (category `ai` or `prompts` — leans `prompts` since the ts-prompt-assist tone demo is the differentiator): port of the chat mode incl. `promptLibrary.ts` tone resolution. Web-only.
   The per-scenario components read keys via `context.resolveSecret` and render a clear "missing key — open Secrets" affordance when absent (do not crash; do not silently no-op).
4. **Do NOT retire `samples/ai-image-gen-sample` in this phase.** Erik decides retirement after validating parity in the testbed. Do not modify the sample at all.
5. **Reuse, don't fork:** if porting reveals a gap in `@fgv/ts-app-shell` (e.g. the modal primitive, `useAiAssist`), extend the library additively rather than hand-rolling in the testbed (repo rule: extend core libraries over working around them). `ts-app-shell` is on the active surface — additive changes need no signoff, but they DO need a Rush change file (`minor` for additive `@public` surface).

## Explicitly NOT in scope (Phase A)

- The generic web runner for CLI scenarios (`webRunnable` flag etc.) — that's Phase B, commissioned separately on top of this phase's secret wiring.
- Persistent/encrypted browser KeyStore.
- Retiring or modifying `ai-image-gen-sample`.
- Any ai-assist library changes beyond what the port strictly requires (expected: none).

## Acceptance criteria

- [ ] `rushx build`, `rushx lint`, `rushx test` (100% coverage) green in `samples/testbed` and every other modified package
- [ ] `rushx build:web` (production webpack) compiles clean — NO `resolve.fallback` stubs (they were deliberately removed in #568; a resolve error means a Node leak)
- [ ] `rushx fixlint` run before final commit
- [ ] No `any`; Result pattern throughout; converters/validators for untyped input
- [ ] Rush change file for `@fgv/ts-app-shell` IF it is modified (samples are not publishable — no change file for testbed itself)
- [ ] Both new scenarios render in the web shell, declare `requiredSecrets`, and degrade gracefully without keys
- [ ] The secrets modal is reachable from the shell chrome and feeds `resolveSecret`
- [ ] `code-reviewer` agent run on the final diff BEFORE coverage-gap closure; findings resolved/dispositioned (layer 1; see CODING_STANDARDS "Review-loop discipline")
- [ ] Brief + state artifacts committed under `.ai/tasks/active/testbed-web-scenarios/`
- [ ] PR opened to `release` with the layer-1 summary + a manual validation runbook (what Erik clicks, per provider, expected pre-filled models); Copilot loop driven to diminishing returns; DO NOT merge

## Sequencing note

Phase B (generic web runner) follows in a separate PR once this phase's secret wiring merges. Keep the secrets store/modal API shaped so a runner panel can consume it unchanged (it already will if scenarios only go through `resolveSecret`).
