# `ai-assist-cross-provider-continuation` — stream brief

**Status:** ready to commission
**Workflow shape:** `stream` — well-specified library extension; no design exploration needed
**Parent cluster:** `per-provider-testbed-scenarios` (this stream is the load-bearing prerequisite that PR #453 paused on)
**Integration branch (shared with the cluster):** `per-provider-testbed-scenarios`

---

## Why this stream exists

The `per-provider-testbed-scenarios` agent (PR #453) is paused. Reason:

The OpenAI / Gemini / xAI scenarios pass `continuationMessages: continuation.messages` on their second `executeClientToolTurn` call. The library **silently drops** them for those providers — `callOpenAiResponsesStream` and `callGeminiStream` don't accept `continuationMessages` at all; only the Anthropic branch of `executeClientToolTurn`'s switch forwards it. The second turn therefore re-runs the original prompt without the reconstructed `function_call` / `function_call_output` (or Gemini `functionCall` / `functionResponse`) items — it's not a true continuation.

This was an intentional Anthropic-only scope in the prior `ai-assist-client-tools` Phase C work (Erik's call at the time: "OpenAI/Gemini/xAI extension is anticipated future work"). The testbed scenarios are the empirical safety net designed to surface exactly this gap. They surfaced it. Now we close it.

The full diagnosis lives at `.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-continuation-roundtrip-anthropic-only.md` on the testbed agent's branch (`claude/magical-newton-S53ZO`). Read it first.

---

## Mission

Extend the client-tool continuation wire-forwarding from Anthropic-only to **all four providers**. Anthropic is already correct; this stream brings OpenAI Responses, Gemini, and (by routing) xAI to the same shape — same minimum-additive-change discipline.

The end state: `executeClientToolTurn`'s `continuationMessages` parameter flows through to every provider's request builder as `rawTail`, the request shape carries the reconstructed assistant turn + tool outputs, and the live continuation round-trip works end-to-end on every provider.

---

## In scope

| Area | Change shape |
|------|---|
| `streamingAdapters/openaiResponses.ts` (`callOpenAiResponsesStream` signature) | Add optional `continuationMessages?: ReadonlyArray<JsonObject>` parameter; thread to builder. xAI routes through this path via `apiFormat: 'openai'` and inherits the fix. |
| `streamingAdapters/gemini.ts` (`callGeminiStream` signature) | Add optional `continuationMessages?: ReadonlyArray<JsonObject>` parameter; thread to builder. |
| `chatRequestBuilders.ts` — `buildMessages` (OpenAI Responses path) | Consume `rawTail` (the `IBuildMessagesOptions.rawTail` field is already declared — currently only honored by `buildAnthropicMessages`). Reconstruct the OpenAI Responses input shape: `function_call` items followed by `function_call_output` items, appended after the user message. The pre-Phase-C continuation builder (`buildOpenAiContinuation` in `streamingAdapters/clientToolContinuationBuilder.ts`) already emits the correct wire shape — verify the format matches what `buildMessages` should produce given the same `rawTail` input. |
| `chatRequestBuilders.ts` — `buildGeminiContents` (Gemini path) | Consume `rawTail`. Reconstruct the Gemini wire shape: a model turn with `functionCall` parts + a user turn with `functionResponse` parts, appended after the user message. Match what `buildGeminiContinuation` already emits. |
| `streamingAdapters/clientToolContinuationBuilder.ts` — `executeClientToolTurn` switch | Forward `continuationMessages` in the `openai` and `gemini` cases (currently only forwarded in `anthropic`). |
| Tests | Unit tests verifying the OpenAI / Gemini / xAI request body actually contains the reconstructed wire items when `continuationMessages` is supplied. Parallels the Anthropic test pattern. **Coverage must remain 100% in `@fgv/ts-extras`.** |

xAI **does not need its own adapter changes** — `apiFormat: 'openai'` means the xAI descriptor routes through `callOpenAiResponsesStream`. Once the OpenAI path forwards `continuationMessages`, xAI gets it automatically. Verify this is the case (don't speculate; read `executeClientToolTurn`'s switch).

---

## Out of scope

- **Behavior changes for Anthropic.** Anthropic is already correct; do not touch `callAnthropicStream`, `buildAnthropicMessages`, or the `anthropic` switch arm except to read for the reference pattern.
- **Scenario edits.** PR #453's scenarios stay as briefed. The whole point of pausing PR #453 was to keep them in their final correct form so they light up the moment this stream's library work lands. Do NOT modify `samples/testbed/src/scenarios/`.
- **MCP layer 2.** Not in this stream.
- **`runToolUseConversation` higher-level orchestration helper.** Future stream.
- **Thinking-content surfacing** (caller-visible thinking stream events for non-Anthropic providers). Separate `ai-assist-thinking-events` follow-up stream — out of scope here.
- **Provider descriptor changes.** None needed.

---

## Package surface

| Path | May modify |
|------|---|
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts` | ✅ |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/gemini.ts` | ✅ |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts` | ✅ (`executeClientToolTurn` switch only) |
| `libraries/ts-extras/src/packlets/ai-assist/chatRequestBuilders.ts` | ✅ (`buildMessages` + `buildGeminiContents` consume `rawTail`) |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts` | ⚠️ read-only (reference pattern) |
| `libraries/ts-extras/src/test/unit/ai-assist/**` | ✅ (add tests for the new wire-position behavior) |
| `libraries/ts-extras/etc/ts-extras.api.md` | ✅ (will regenerate; commit the regenerated output) |
| `samples/testbed/**` | ❌ (out of scope — testbed PR is paused, do not touch) |
| `libraries/ts-prompt-assist/**` | ❌ |
| Any other package | ❌ |

---

## Required reading (in order)

1. **`.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-continuation-roundtrip-anthropic-only.md`** — on branch `claude/magical-newton-S53ZO`. The full diagnosis + proposed extension shape. THE load-bearing read.
2. **`.ai/tasks/completed/2026-06/ai-assist-client-tools/findings/inbox/2026-06-04-continuation-message-wire-position.md`** — the prior stream's finding documenting why the Anthropic-only scope was intentional, and how the `rawTail` option was pre-declared anticipating this extension.
3. **`.ai/tasks/completed/2026-06/ai-assist-client-tools/README.md`** — what the prior cluster shipped, the locked architectural decisions, the wire-position constraint.
4. **`libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts`** + **`buildAnthropicMessages`** in `chatRequestBuilders.ts` — the reference implementation. Internalize how `continuationMessages` → `rawTail` → wire-appended works for Anthropic. This is the shape to parallel for OpenAI and Gemini.
5. **`libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts`** — both `buildOpenAiContinuation` and `buildGeminiContinuation` already exist and emit the correct wire shape for the second turn. Your work threads that same shape through `rawTail` so the **first-call-with-continuation** request body carries it; the existing continuation-builder logic stays intact.
6. **`libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts`** + **`gemini.ts`** — the adapters you'll be modifying. Read enough to understand the current parameter list and how messages flow into the request.
7. **`libraries/ts-extras/src/packlets/ai-assist/chatRequestBuilders.ts`** — `IBuildMessagesOptions.rawTail` already exists; `buildAnthropicMessages` consumes it; the other two paths don't yet.
8. **`.ai/instructions/CODING_STANDARDS.md` § "Extending Core Libraries Over Working Around Them"** — load-bearing posture: extend, don't work around.
9. **`.ai/instructions/TESTING_GUIDELINES.md` § "Coverage Gap Resolution"** — L37: `code-reviewer` runs BEFORE 100%-coverage closure.

---

## Skills to load

- `/published-primitives-reflex` — before writing any utility-shaped code.
- `/result-pattern` — all fallible operations return `Result<T>`.
- `/result-tests` — `@fgv/ts-utils-jest` matchers.
- `/type-safe-validation` — if you touch any converter or schema.

---

## Phases

1. **Read surface** — finish the required reading list. Internalize the Anthropic reference pattern. Verify that `rawTail` is already declared on `IBuildMessagesOptions`. Confirm xAI routes through OpenAI's path (don't speculate).
2. **OpenAI path** — extend `callOpenAiResponsesStream` signature; thread `continuationMessages` into `buildMessages`; have `buildMessages` consume `rawTail` and emit the `function_call` + `function_call_output` items at the tail of the request input. Wire test for the request-body shape.
3. **Gemini path** — same as OpenAI but for `callGeminiStream` + `buildGeminiContents`; tail-emit the model turn with `functionCall` parts + user turn with `functionResponse` parts.
4. **Switch wiring** — update `executeClientToolTurn`'s `openai` and `gemini` cases to forward `continuationMessages` (mirror what the `anthropic` case already does).
5. **Coverage closure** — STOP before chasing 100% measured coverage; run the `code-reviewer` agent on the diff first (per L37). Address findings. THEN close coverage gaps.
6. **Verification** — `rushx build` + `rushx lint` + `rushx test` clean. Confirm 100% coverage. Confirm no regressions in existing Anthropic tests.
7. **Optional empirical check** — if you have access to OPENAI_API_KEY / GEMINI_API_KEY / XAI_API_KEY in your environment, you may run `samples/testbed` scenarios as a sanity check (you can't modify them, but running them is fine). If keys are absent, that's the testbed PR's verification path — not your blocker.

---

## Acceptance criteria

- [ ] `callOpenAiResponsesStream` accepts an optional `continuationMessages?: ReadonlyArray<JsonObject>` parameter and threads it through to `buildMessages` as `rawTail`.
- [ ] `callGeminiStream` accepts an optional `continuationMessages?: ReadonlyArray<JsonObject>` parameter and threads it through to `buildGeminiContents` (or the equivalent Gemini builder) as `rawTail`.
- [ ] `buildMessages` (OpenAI Responses path) consumes `rawTail` and emits the correct OpenAI Responses tail shape (`function_call` + `function_call_output` items at the end of the input array).
- [ ] `buildGeminiContents` (or equivalent) consumes `rawTail` and emits the correct Gemini tail shape (model turn `functionCall` parts + user turn `functionResponse` parts).
- [ ] `executeClientToolTurn`'s `openai` and `gemini` switch arms forward `continuationMessages` to their respective adapters.
- [ ] xAI inherits the fix via `apiFormat: 'openai'` routing (verified, not assumed).
- [ ] No behavior changes for Anthropic. Existing Anthropic tests pass unmodified.
- [ ] **New unit tests** verify the OpenAI + Gemini request body actually contains the reconstructed wire items when `continuationMessages` is supplied. Parallel the existing Anthropic test pattern.
- [ ] `rushx build` PASS in `@fgv/ts-extras`.
- [ ] `rushx lint` PASS clean (no warnings — treated as errors on CI).
- [ ] `rushx test` PASS with 100% coverage in `@fgv/ts-extras`.
- [ ] `rushx fixlint` run before final commit.
- [ ] **`code-reviewer` agent run on the final diff BEFORE 100%-measured-coverage closure**, per L37. Findings resolved or dispositioned. Reference: `.ai/tasks/completed/2026-06/ai-assist-client-tools/README.md` (this is the canonical L37 reference observation).
- [ ] `etc/ts-extras.api.md` regenerated by API Extractor; commit the regenerated output.
- [ ] PR opens against the `per-provider-testbed-scenarios` integration branch (NOT `release`).

---

## Exit artifact shape

Standard stream completion:

- `state.md` — phase-by-phase progress, decisions made.
- `result.md` — what shipped, files changed, code-reviewer pass summary, any follow-up findings filed.

Artifact migration to `completed/` is **not** this stream's job — it ships in the cluster-close PR (integration → release) once both this stream and the testbed stream are done.

---

## Branching

**This stream shares the `per-provider-testbed-scenarios` integration branch** with the testbed stream (per L35's single-commit-per-cluster principle — both ship as one cluster).

- **Integration branch:** `per-provider-testbed-scenarios` (already created; this brief is committed there).
- **Agent's work branch:** fork off the integration branch — `chore/ai-assist-cross-provider-continuation-impl` (or whatever name fits).
- **PR target:** `per-provider-testbed-scenarios` (the integration branch — NOT `release`).
- **Cluster-close PR:** opened by the orchestrator when **both** this stream and the testbed stream are complete, bundling the artifact migration. Squash-merges to `release`.

After this stream's PR merges onto integration, the testbed PR #453 can rebase onto the new integration HEAD and resume. The testbed scenarios were intentionally left in their final form — they should light up on the next live run with no scenario edits.

---

## Resume protocol

If the session is interrupted: read `state.md` to determine the current phase and what's done. Resume at the next phase boundary.
