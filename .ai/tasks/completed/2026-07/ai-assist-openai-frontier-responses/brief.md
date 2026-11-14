# Brief — ai-assist: route OpenAI Responses-API-only models through the completion path (restore invokable frontier)

**Branch:** `claude/ai-assist-openai-frontier-responses` (off `release`).
**Surface:** `@fgv/ts-extras` → `src/packlets/ai-assist` (**active** surface — additive/breaking OK per ACTIVE_DEVELOPMENT.md).
**Ships under the enforced coverage gate** (#517/#518) — 100% coverage is real; hit it for real.
**Ends at a STOP-FLAG** — a live `gpt-5.5-pro` canary is the final gate and is run by the principal with a real key (no keys in CI). Do NOT attempt a live call; build the canary scenario ready-to-run and STOP.

## Background (from docs/FUTURE.md "OpenAI frontier via Responses routing")

`gpt-5.5-pro` (alias `@openai:pro`) is a **Responses-API-only** model — uninvokable via `/chat/completions`. The model-tiers stream (B5) therefore dropped the `frontier` key from the OpenAI `defaultModel`, so a `frontier` request cascades `frontier → advanced → gpt-5.5`. `@openai:pro` is retained but reachable only via `modelOverride` — and even that **fails today**, because `callProviderCompletion`'s OpenAI branch always uses `/chat/completions` for non-tools calls. This stream makes Responses-only models invokable on the completion (and streaming-completion) path, then restores `frontier: '@openai:pro'`.

## Code map (verified — paths under `libraries/ts-extras/src/packlets/ai-assist/`)

- **Completion dispatch:** `apiClient.ts:700` `callProviderCompletion` → `Promise<Result<IAiCompletionResponse>>`. `apiFormat` switch at `:775`; OpenAI branch `:776-789` routes on `hasTools`: tools → `callOpenAiResponsesCompletion` (`:479`, POSTs `/responses`), else → `callOpenAiCompletion` (`:405`, POSTs `/chat/completions`). Resolved model is available as `config.model` (set `:760-764` from `modelResult.value` at `:742`).
- **`callOpenAiResponsesCompletion`** (`apiClient.ts:479-524`): returns a normal `IAiCompletionResponse` (NOT tool-turn-shaped). **`tools` is currently a REQUIRED positional param** and the body **unconditionally sets `tools: toResponsesApiTools(tools)` at `:497`.** For a no-tools Responses route, make `tools` optional and omit the body field when empty/undefined.
- **Streaming:** `streamingClient.ts:160-163` mirrors the same `hasTools` gate; tools → `callOpenAiResponsesStream` (`streamingAdapters/openaiResponses.ts`), else the chat-completions stream. Apply the identical route change here (see Scope item 4).
- **Model resolution:** `model.ts:675` `resolveProviderModel` (called `apiClient.ts:738` with the tier as context); `ModelSpecKey` `model.ts:461`; `TIER_FALLBACK` `model.ts:523`. Returns the concrete id (aliases resolved).
- **OpenAI descriptor:** `registry.ts:189-207` — `defaultModel` (has `base`/`advanced`, **no `frontier`**) + `aliases` (`@openai:pro → gpt-5.5-pro`). Sibling per-model prefix arrays on the descriptor: `imageGeneration[]` (`:225`) and `embedding[]` (`:213`), both keyed by `modelPrefix` — the shape to mirror.
- **Capability config:** `IAiModelCapabilityRule`/`Config` (`model.ts:1397-1421`), `DEFAULT_MODEL_CAPABILITY_CONFIG` (`registry.ts:428`) — this is **list-models only, NOT read by the completion path**, and `AiModelCapability` is a closed public union. **Do NOT add `responsesOnly` to that union** — wrong layer, would widen a validator surface and still not be wired to completion.
- **Tests:** `test/unit/ai-assist/apiClient.test.ts` — `describe('openai format')` `:417` (asserts `/chat/completions`), `describe('openai format with tools (Responses API)')` `:795` (asserts `/responses`, uses `responsesApiResponse(...)` mock helper `:118`). Streaming: `streamingClient.test.ts`. Registry: `registry.test.ts`.
- **Testbed canary:** `samples/testbed/src/scenarios/modelTiers/{index.ts,canary.ts}`; `openaiModelTiersScenario` (`index.ts:149`, runs `tiers: ['base','advanced','frontier']`, `frontier` currently proves the cascade); live seam `buildLiveComplete` (`:59-83`) calls `AiAssist.callProviderCompletion` per tier; scenarios registered in `samples/testbed/src/scenarios/index.ts` (`:32-45`).

## Design decision (LOCKED — do not re-litigate)

**Declarative Responses-only marker on the provider descriptor, matched by model id — NOT frontier-tier-specific routing.** Rationale: the defect is "gpt-5.5-pro is uninvokable on the completion path," independent of tier — a direct `modelOverride: 'gpt-5.5-pro'` must also route to Responses. A tier-only hack misses that. A declarative model-prefix marker fixes both and mirrors the existing `imageGeneration`/`embedding` `modelPrefix` arrays; new `-pro`/Responses-only lines are a one-line descriptor edit (same maintenance loop as aliases).

## Scope (do)

1. **Descriptor field.** Add optional `responsesOnlyModelPrefixes?: ReadonlyArray<string>` to `IAiProviderDescriptor` (place with the other optional per-model arrays; TSDoc: "Concrete model ids (prefix-matched) that must be invoked via the OpenAI Responses API rather than chat completions — e.g. `gpt-5.5-pro`. Non-OpenAI `apiFormat`s ignore this."). On the OpenAI descriptor (`registry.ts`), set `responsesOnlyModelPrefixes: ['gpt-5.5-pro']`.
2. **Predicate.** Add `isResponsesOnlyModel(descriptor: IAiProviderDescriptor, modelId: string): boolean` = `descriptor.responsesOnlyModelPrefixes?.some((p) => modelId.startsWith(p)) ?? false`. Co-locate with `resolveProviderModel` in `model.ts` (export it if the tests/consumers need it; prefer internal + test via public behavior unless a unit test genuinely needs the direct call). Reuse it in both dispatch sites — do not duplicate the check.
3. **Completion route.** In `callProviderCompletion` OpenAI branch (`apiClient.ts:776`), change the guard to `if (hasTools || isResponsesOnlyModel(descriptor, config.model))` → `callOpenAiResponsesCompletion`. Make that callee's `tools` param optional (`ReadonlyArray<AiServerToolConfig> = []` or `?`) and **omit `tools` from the request body when there are none** (guard the `:497` assignment) — a no-tools Responses call must not send an empty/……tools array if that would change behavior; match how the chat path handles no-tools.
4. **Streaming route.** Apply the identical `hasTools || isResponsesOnlyModel(...)` gate at `streamingClient.ts:160-163` so a streaming frontier/gpt-5.5-pro request routes to `callOpenAiResponsesStream`. Make the streaming Responses adapter tolerate no tools the same way (optional tools, omit the body field). **This is required** — restoring the `frontier` defaultModel key without it would make streaming-frontier 400.
5. **Restore frontier.** Re-add `frontier: '@openai:pro'` to the OpenAI `defaultModel` map (`registry.ts:191`), and update the now-stale comment there (it currently explains the *absence* of the key). A `frontier` completion/stream request now resolves to `gpt-5.5-pro` and routes to Responses.
6. **Do NOT touch** the client-tools path (`executeClientToolTurn` already uses Responses for OpenAI — a frontier+tools call already works), the Anthropic/Gemini/xAI branches, image, or embedding paths.

## Constraints

- No `any`; `Result<T>` for fallible ops; no manual-typeof-then-cast. `__`-prefix unused params.
- Reasoning-model temperature: `gpt-5.5-pro` is a reasoning model — B5 fixed "unconditional default temperature 400s current-gen models." The Responses path is inherited from the existing tools route, so temperature/thinking handling comes for free — but **verify no default temperature is force-sent** on the responses-only route (the canary is the live proof; unit-assert the body shape).
- Additive public surface (`responsesOnlyModelPrefixes?`, possibly `isResponsesOnlyModel`) on the active surface — fine. Regenerate `etc/ts-extras.api.md`.
- **100% coverage — actually enforced.**

## Tests (mocked wire — clone the existing Responses/chat suites)

- **Predicate:** `isResponsesOnlyModel` true for `gpt-5.5-pro`(+prefix variants), false for `gpt-5.5`/`gpt-5.4-mini`/undefined-list providers.
- **Completion routing:** a `modelOverride: 'gpt-5.5-pro'` (no tools) call hits `/responses` (assert URL + body **omits** `tools`); a `frontier`-tier call resolves to `gpt-5.5-pro` and hits `/responses`; a `base`/`advanced` call still hits `/chat/completions`; a tools call still hits `/responses` (unchanged).
- **Streaming routing:** same matrix for the streaming client (`/responses` for responses-only/frontier, `/chat/completions` stream otherwise).
- **Registry:** OpenAI `defaultModel.frontier` resolves through `@openai:pro → gpt-5.5-pro`; `responsesOnlyModelPrefixes` present.
- **Regression:** all existing openai chat/tools/streaming tests still green (the change is purely an added route condition).

## Canary (STOP-FLAG — build, do not run)

Update `openaiModelTiersScenario` (and its `modelTiers/canary.ts` expectations + `test/unit/scenarios/modelTiers.test.ts`) so the `frontier` tier now **genuinely expects `gpt-5.5-pro` via the Responses route** (not the cascade-to-gpt-5.5 it asserts today). Keep it registered in `scenarios/index.ts`. The scenario must be runnable by the principal against the live API with a real key; the unit test asserts the *scenario wiring* (mocked), not a live call. **Do NOT run the live canary — no keys here.** Leave a clear one-line note in the result artifact: "STOP-FLAG: live `gpt-5.5-pro` frontier canary ready in `openaiModelTiersScenario`; principal runs it as the final gate."

## Sequence

Implement → run the `code-reviewer` agent SYNCHRONOUSLY (`run_in_background: false`) on `git diff origin/release` **before** coverage-chasing; resolve P1s, resolve-or-disposition P2s → `rushx fixlint` → `rushx lint` (clean) → `rushx build` (api-extractor regen) → `rushx test` @ 100% → also build/test `samples/testbed` if it has its own gates → `rush change --bulk --bump-type minor --target-branch origin/release` (additive feature; ensure the change file is COMMITTED) → commit + push → open PR onto `release`.

## Proof of work

`git log --oneline -3`; build/lint/test tails (100%); the `etc/ts-extras.api.md` diff (new `responsesOnlyModelPrefixes?` field + any exported predicate); the routing test output (responses-only + frontier → `/responses`; base/advanced → `/chat/completions`) for BOTH completion and streaming; confirmation existing openai suites are green; the restored `frontier` defaultModel entry; `code-reviewer` findings + dispositions; and the STOP-FLAG note naming the ready canary scenario for the principal's live `gpt-5.5-pro` run.
