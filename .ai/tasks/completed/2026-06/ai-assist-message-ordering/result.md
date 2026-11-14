# Result: `ai-assist-message-ordering`

**Status:** complete, gates green, Copilot loop converged. Awaiting merge of PR #478 into the `ai-assist-message-ordering` integration branch.
**Implementation branch:** `ai-assist-message-ordering-impl` → PR [#478](https://github.com/ErikFortune/fgv/pull/478).

## Outcome

The two ai-assist turn entry points placed conversation history on opposite sides of the current user turn (completion used `tail:`, the client-tool turn path used `head:`) — a silent history reorder for any consumer with one flat ordered list and a single adapter. Resolved per option (a): **every turn entry point now takes the unified ordered `{ system?, messages }` shape and owns the system/history/current-turn split internally.**

### Unified shape + `AiPrompt` decision

- New public `IChatRequest { system?: string; messages: ReadonlyArray<IChatMessage> }` — last message is the current user turn, preceding messages are history. All turn entry points `extends IChatRequest`: `callProviderCompletion`, `callProviderCompletionStream`, `generateJsonCompletion`, `executeClientToolTurn`, and the proxy variants.
- A shared `splitChatRequest(system, messages)` peels the last message as the current turn and the rest as `head`; the per-provider builders already accept ordered history via `head`, so the completion path switched `tail → head` and both paths linearize identically: `[system, …history, current user turn, …continuation]`. The dead `tail` builder option was removed.
- `system` stays a distinct top-level field (matches how the builders separate system). `AiPrompt` kept as a convenience, gained `toRequest()`. `IChatMessage` gained optional `attachments` (honoured on the current turn only). `continuationMessages` unchanged — distinct post-current-turn axis.

### Proxy wire-contract delta (breaking)

Both proxied paths now serialize `{ system?, messages }` instead of `{ prompt:{system,user,attachments}, additionalMessages/messagesBefore }`. A proxy server must read `body.system` + `body.messages` (current turn = last entry, attachments inline on the current turn only). Noted in the PR for PersonAIlity.

### Migrated callers (in-repo, lockstep)

- `ts-app-shell` `useAiAssist.ts` (`generateDirect` / `streamDirect`; external hook signatures preserved → `samples/ai-image-gen-sample` needed no change).
- `samples/testbed/src/scenarios/{anthropic,gemini,openai,xai}ClientTools`.
- `ts-extras` ai-assist tests. Regenerated `etc/ts-extras.api.md`; Rush change file (`type: none`); updated `LIBRARY_CAPABILITIES.md`.

### Load-bearing regression test

`messageOrdering.test.ts` feeds the **same** ordered `[user h1, assistant h2, user current]` through the completion path and the client-tool turn path for Anthropic, an OpenAI-shaped provider, and Gemini, and asserts the conversation linearizes identically (`toolConv` deep-equals `completionConv`, history before the current turn). Passes on all three. Also covers the `splitChatRequest` empty / non-user-last guards at every entry point.

## Entry-point parity (final state)

The Copilot loop walked the same seam outward (each finding built on the prior fix). End state — all five turn entry points apply identical up-front validation/normalization:

| Check | completion | stream | proxied completion | proxied stream | tool-turn |
|---|---|---|---|---|---|
| non-empty + trailing-user | ✓ | ✓ | ✓ | ✓ | ✓ |
| `acceptsImageInput` preflight | ✓ | ✓ | ✓ | ✓ | ✓ |
| current-turn-only attachments | ✓ (builders) | ✓ (builders) | ✓ (`normalizeOutboundMessages`) | ✓ (`normalizeOutboundMessages`) | ✓ (builders) |
| empty-model guard | ✓ | ✓ | n/a (server resolves) | n/a | ✓ |
| temp/thinking conflict | ✓ | ✓ | n/a (server-side) | n/a | n/a (pre-resolved thinking) |

Intentional asymmetries: temp/thinking conflict + full model resolution on the proxy paths are server-side (the proxy doesn't resolve the model client-side, so it can't replicate them without duplicating the resolver).

## Review-loop record

- **Layer 1 — `code-reviewer`** (pre-push): no P1/P2 code findings. Doc-drift P2s in `LIBRARY_CAPABILITIES.md` fixed. `{@link AiAssist.IChatRequest}` resolver warnings dispositioned (consistent with 156 pre-existing same-class warnings).
- **Layer 2 — Copilot loop (implementer-driven):** 4 rounds.
  - R1 (`599ae2373`): proxy paths skipped the `splitChatRequest` invariants + image-input preflight — fixed.
  - R2 (`9f621149b`): `acceptsImageInput` preflight not uniform (proxy-stream + tool-turn) — fixed.
  - R3 (`281b6bc32`): proxy paths forwarded `messages` verbatim → history attachments leaked — added `normalizeOutboundMessages`; **swept the seam end-to-end** and proactively added the `executeClientToolTurn` empty-model guard.
  - R4: **clean, no new comments.**
  - **Stopped at round 4 on diminishing returns** (R1–R3 substantive on the same parity seam, R4 clean; well under the 10-round cap).

## Gates

`rushx build` + `rushx lint` + `rushx test` (100% coverage) pass in `@fgv/ts-extras`, `@fgv/ts-app-shell`, and `@fgv/testbed`. `rushx fixlint` run. (`@fgv/ts-json-base` `mutableFsTree` permission test flakes only under the run-as-root parallel `rush test` invocation — pre-existing, unrelated; already tracked as P4 tech debt.)

## Follow-up captured

- **[P3] `ai-assist/apiClient.ts` is at the 2000-line `max-lines` cap; decompose it.** Recorded in `docs/TECH_DEBT.md` — PR #478 repeatedly trimmed JSDoc to add proxy guards under the cap; split the monolith by concern before the next ai-assist feature stream.

## Post-merge

- Promote this task dir to `.ai/tasks/completed/2026-06/ai-assist-message-ordering/` after PR #478 merges.
- PersonAIlity collapses its local current-message → `prompt.user` / prior → `messagesBefore` split once this lands.
