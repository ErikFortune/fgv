# Stream brief: `ai-assist-message-ordering` — unify conversation-history positioning

**Status:** commissioned 2026-06-06 (Erik). Integration branch: `ai-assist-message-ordering` (off `release`).
**Type:** design-note-then-implement, single stream. **Breaking change — sanctioned** (ai-assist is active surface; ACTIVE_DEVELOPMENT permits breakage; the only consumers are this repo + PersonAIlity, both migrated in lockstep).
**Origin:** consumer (PersonAIlity) footgun report, 2026-06-06.

---

## The problem (confirmed in code)

ai-assist's two turn entry points put conversation history on **opposite sides** of the current user turn — same underlying per-provider builders, opposite slot:

- **`callProviderCompletion` / `callProviderCompletionStream`** pass history as **`tail:`** → `buildAnthropicMessages(prompt, { tail: additionalMessages })` (`apiClient.ts:474/545/619/692`). Linearizes `[system, user, ...history]`.
- **`executeClientToolTurn`** passes history as **`head:`** → the streaming adapters take `{ head: messagesBefore }` (`streamingAdapters/anthropic.ts:482`, `gemini.ts:221`, `openaiChat.ts:164`, `openaiResponses.ts:469`). Linearizes `[system, ...history, user]`.

A consumer with one flat `[system, …history, currentUser]` list and a single adapter maps it correctly for the completion path (`user = messages[1]`, `additionalMessages = rest`) but gets a **silent history reorder** through `executeClientToolTurn`: the oldest turn becomes the current prompt and the real question is buried in `messagesBefore`. Symptom: a tool-using agent re-answers the oldest question every turn. Invisible to prompt-level logging (system unchanged; only order is wrong).

## Resolution (decided: option (a))

**Both entry points accept a single ordered `messages[]` and own the system/user/history split internally** — making ordering un-mistakable and killing the adapter-reuse trap. (Erik + the consumer chose (a) over rename-alignment (b) / docs-only (c): the failure is *silent*, so eliminate it at the API, not paper over it.)

**Key tractability fact:** the per-provider builders ALREADY accept arbitrary ordered lists via their `{ head, tail }` options. The asymmetry lives purely at the **entry-point param layer**, not deep in the adapters — so this is concentrated param/assembly work, not a per-provider rewrite.

## Step 1 — short design note first (`.ai/tasks/active/ai-assist-message-ordering/design.md`)

Pin these decisions, commit the note with the implementation:

- **Unified shape.** Likely `{ system?: string, messages: ReadonlyArray<IChatMessage> }` (ordered conversation; the last message is the current turn) replacing both `{ user, additionalMessages }` (completion) and `{ prompt: AiPrompt, messagesBefore }` (tool turn). Decide whether `system` stays a separate top-level field (providers vary — Anthropic `system` param, OpenAI system role, Gemini `systemInstruction`) or folds into `messages` as a `system`-role entry. Recommend the former (keep `system` distinct; `messages` = user/assistant turns) unless you find a reason otherwise — it matches how the builders already separate system.
- **`AiPrompt` fate.** It's used by the in-repo callers. Decide: keep as a thin convenience that lowers to `{ system, messages: [user] }`, or remove it. Minimize churn while killing the footgun — keeping it as a convenience constructor is fine **as long as the entry points no longer take the asymmetric `{user, additionalMessages}` / `{prompt, messagesBefore}` pair**.
- **`continuationMessages` stays distinct.** It is the post-current-user tool-continuation axis (provider-format wire objects from a prior turn). It is NOT history and must not blur into `messages`. Keep it as-is; just ensure it composes after the unified `messages` list.
- **Proxy wire contract.** `callProxiedCompletion*` serialize `additionalMessages` and the proxy streaming path serializes `messagesBefore` into the proxy request body (`apiClient.ts:1915`, `streamingAdapters/proxy.ts:151`). Unify these body fields to `messages` too, and note the proxy-server wire-contract change in the PR (consumers running a proxy must update).

## Step 2 — implement

- Both completion entry points (`callProviderCompletion`, `callProviderCompletionStream`) + `generateJsonCompletion` (wraps completion) + `executeClientToolTurn` + the proxy variants (`callProxiedCompletion` / streaming proxy). All take the unified shape.
- Collapse the entry-layer `additionalMessages`(tail) / `messagesBefore`(head) split into one ordered linearization. The builders can keep their `{head,tail}` internals or be simplified — your call, but the *entry points* must be symmetric.
- **Migrate all in-repo callers** (the breaking part): `libraries/ts-app-shell/src/packlets/ai-assist/useAiAssist.ts` and the four `samples/testbed/src/scenarios/{anthropic,gemini,openai,xai}ClientTools/index.ts` scenarios. Plus all ts-extras ai-assist tests.
- Regenerate `etc/ts-extras.api.md`; add a Rush change file for `@fgv/ts-extras` (type `none`, per the ai-assist convention).

## The load-bearing regression test (do not skip)

Add a test that proves the footgun is dead: given the **same** ordered `messages[]`, the completion path and the tool-turn path linearize history to the **identical position** relative to the current user turn (for at least Anthropic + one OpenAI-shaped + Gemini). This is the structural guard that the asymmetry can't reappear.

## Gates & process

- `rushx build` + `rushx lint` + `rushx test` (100%) in `ts-extras` AND every migrated package (`ts-app-shell`, `samples/testbed`). `rushx fixlint` before final commit.
- Run the `code-reviewer` agent on the diff BEFORE coverage-chasing; resolve/disposition findings; summarize in the PR.
- The live testbed `*ClientTools` scenarios are the empirical check — message-order bugs are exactly what they catch (per the per-provider-testbed cluster's history). If you can't run them live, at minimum assert order in unit tests as above.
- Sub-branches off `ai-assist-message-ordering`; PR into it. PR description: the unified shape decided, `AiPrompt` disposition, the proxy wire-contract change, the caller migration list, validation + code-reviewer summary.
- **Consumer coordination:** note in the PR that PersonAIlity collapses its local current-message→prompt.user / prior→messagesBefore split once this lands. Keep the migration mechanical and obvious.

## Report-back

Branch, PR number, the unified shape + `AiPrompt` decision, the proxy wire-contract delta, the migrated callers, and confirmation the symmetric-ordering regression test passes on all providers.
