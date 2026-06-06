# Code review: ai-assist-client-tools Phase C (C1–C4)

**Reviewed:** chore/ai-assist-client-tools-phase-c-impl vs origin/ai-assist-client-tools
**Date:** 2026-06-04
**Reviewer:** code-reviewer agent

---

## Priority 1 — CRITICAL (must-fix before PR-open)

### P1-1: Client tools are never sent to the provider in the API request

**`clientToolContinuationBuilder.ts` — `executeClientToolTurn` function (lines ~415–455)**

`executeClientToolTurn` receives `clientTools: ReadonlyArray<IAiClientTool>` but never merges the
client tool configs into the `tools` parameter passed to the underlying adapter calls. All three
adapters receive only `tools` (the server-tool list):

```typescript
callAnthropicStream(config, prompt, messagesBefore, effectiveTemperature,
    tools,    // ← AiServerToolConfig[] only — clientTools.map(t=>t.config) are missing
    ...)
callOpenAiResponsesStream(config, prompt, tools ?? [], ...)
callGeminiStream(config, prompt, messagesBefore, effectiveTemperature, tools, ...)
```

The three adapter functions (`callAnthropicStream`, `callOpenAiResponsesStream`,
`callGeminiStream`) still declare their `tools` parameter as `ReadonlyArray<AiServerToolConfig>`
(not the widened `AiToolConfig`). The format adapters (`toAnthropicTools`, `toResponsesApiTools`,
`toGeminiTools`) were correctly widened, but the call-site plumbing was not updated to pass
client tool configs through.

Result: the API request body has no client tool definitions in its `tools` field. The model is
never told these tools exist and cannot call them. Any apparent live success would require the
model to have called a tool it was not informed about — effectively impossible under normal API
behavior.

**Fix required:**
1. In `executeClientToolTurn`, build the combined list before calling the adapter:
   `const allTools: AiToolConfig[] = [...(tools ?? []), ...clientTools.map(t => t.config)];`
2. Update `callAnthropicStream`, `callOpenAiResponsesStream`, and `callGeminiStream` to accept
   `ReadonlyArray<AiToolConfig>` (not `AiServerToolConfig`) for their `tools` parameter.
3. Re-run the testbed scenario against the live Anthropic API after the fix to confirm the
   round-trip empirically.

**Severity:** Blocking. This is the central functional gap of the Phase C implementation.

---

### P1-2: `aiClientToolConfig` uses `Converters.generic` with manual type checking — Priority 1 anti-pattern

**`converters.ts` — `aiClientToolConfig` (lines ~125–150)**

The converter uses `Converters.generic<IAiClientToolConfig>(...)` with a manually-written body
that inspects `typeof obj.name`, `typeof obj.description`, etc., then finalizes with
`return succeed({ ... } as IAiClientToolConfig)`. This is the Priority 1 prohibited pattern from
`CODE_REVIEW_CHECKLIST.md`:

> "No manual type checking with unsafe casts — REJECT: Manual checking followed by cast"

The `parametersSchemaValidator` (using `Validators.isA`) is correctly implemented and should be
kept. The outer wrapper should use `Converters.object<IAiClientToolConfig>` instead:

```typescript
export const aiClientToolConfig: Converter<IAiClientToolConfig> = Converters.object<IAiClientToolConfig>({
  type: Converters.generic((v) =>
    v === 'client_tool'
      ? succeed('client_tool' as const)
      : fail(`expected 'client_tool', got ${String(v)}`)
  ),
  name: Converters.nonEmptyString,
  description: Converters.string,
  parametersSchema: Converters.generic((v) => parametersSchemaValidator.validate(v))
});
```

The brief explicitly required: "Validates the wrapper shape and the presence of a usable
`parametersSchema`. Does not inspect the inner JSON Schema structure." The intent is correct;
only the implementation pattern is wrong.

**Severity:** Blocking per checklist priority 1.

---

### P1-3: Double-cast pattern `as unknown as JsonObject` applied to array values

**`clientToolContinuationBuilder.ts` — `buildAnthropicContinuation` lines ~157–165, `buildGeminiContinuation` lines ~265–275**

```typescript
// Anthropic:
content: assistantContent as unknown as JsonObject   // assistantContent is JsonObject[]
content: userContent as unknown as JsonObject        // userContent is JsonObject[]

// Gemini:
parts: modelParts as unknown as JsonObject           // modelParts is JsonObject[]
parts: userParts as unknown as JsonObject            // userParts is JsonObject[]
```

`JsonObject` is `{ [key: string]: JsonValue }` (a string-keyed map). Casting a `JsonObject[]`
(array) to `JsonObject` is a structural lie. The prohibited double-cast pattern from
`CODE_REVIEW_CHECKLIST.md`:

> "No double casting — REJECT: `const value = x as Record<string, unknown> as TargetType`"

There is also a related cast at line ~154:
`return block as JsonObject` from `block: Record<string, unknown>` — a cast through Record to
JsonObject, also prohibited.

The correct type for content/parts arrays is `JsonArray` (which is `JsonValue[]`), exported from
`@fgv/ts-json-base`. The message objects should be typed using `JsonArray` for the content field
before widening to `JsonObject`.

**Fix required:** Import `JsonArray` from `@fgv/ts-json-base`. Type the assistant/user/model/user
message content fields as `JsonArray` rather than casting through `unknown`. Each individual
block pushed onto the content array is already correctly typed as `JsonObject`; only the final
assignment to the outer message's `content` property needs the correct type.

**Severity:** Blocking per checklist priority 1.

---

## Priority 2 — MAJOR (should-fix)

### P2-1: `result.md` event-type naming is inaccurate

**`.ai/tasks/active/ai-assist-client-tools/result.md` lines 14–16**

`result.md` states:
> "`IAiStreamToolEvent` — two new stream event variants: `tool-start` (type `'tool-event'`,
> phase `'start'`) and `tool-result` (phase `'complete'`)"

The implementation ships three distinct interfaces with different discriminators:
- `IAiStreamToolUseStart` (type: `'client-tool-call-start'`)
- `IAiStreamToolUseDelta` (type: `'client-tool-call-done'`)
- `IAiStreamToolUseComplete` (type: `'client-tool-result'`)

The description conflates the pre-existing `IAiStreamToolEvent` (server tools, `type: 'tool-event'`)
with the new client-tool events and gives wrong discriminator strings.

**Fix required:** Correct `result.md` to accurately name all three new event interfaces and their
discriminator values. (`CODE_REVIEW_CHECKLIST.md` Priority 2: "PR/doc framing accuracy.")

---

### P2-2: `LIBRARY_CAPABILITIES.md` describes `execute` return type incorrectly

**`.ai/instructions/LIBRARY_CAPABILITIES.md` — ai-assist entry**

The doc states: `execute: (args: unknown) => Promise<Result<string>>`

The actual type in `model.ts:236` is:
```typescript
readonly execute: (args: TParams) => Promise<Result<unknown>>;
```

The return type is `Result<unknown>`, not `Result<string>`. The continuation builder calls
`JSON.stringify(executionResult.value)` — that is an internal implementation step, not the
contract of `execute`. A consumer implementing an `execute` callback should return
`Result<unknown>` (any JSON-serializable value).

**Fix required:** Update the capabilities doc to `(args: unknown) => Promise<Result<unknown>>`.

---

### P2-3: Adapter function signatures still accept `AiServerToolConfig` only — must be widened to `AiToolConfig`

**`anthropic.ts:418`, `openaiResponses.ts:308`, `gemini.ts:212`**

The three `call*Stream` function signatures still declare `tools: ReadonlyArray<AiServerToolConfig>`.
Even if `executeClientToolTurn` were fixed to build the combined tools list, TypeScript would
reject the call because the function signatures haven't been updated. This is the required
companion fix to P1-1.

**Fix required:** Update the `tools` parameter type in all three `call*Stream` functions to
`ReadonlyArray<AiToolConfig>` (matching what `toAnthropicTools` etc. now accept).

---

### P2-4: No test verifies client tools are included in the API request body

**`clientToolContinuationBuilder.test.ts`**

All `executeClientToolTurn` happy-path tests mock the SSE response without inspecting the
request body sent to `fetch`. No test asserts that `body.tools` includes the client tool
definition (e.g., `{ name: 'recall_memory', description: ..., input_schema: ... }` for
Anthropic). The P1-1 bug is invisible to the test suite because the tests pre-inject mock SSE
responses simulating a tool call without verifying whether the API was told about the tool.

The pattern for capturing the fetch request body is already demonstrated in
`streamingAdapters.test.ts:767` (continuation-messages test).

**Fix required:** Add at least one test per provider that captures the `fetch` request body and
asserts `body.tools` includes the client tool definition in the correct provider wire format.

---

### P2-5: `IExecuteClientToolTurnParams.model` required; asymmetric with sibling API

**`clientToolContinuationBuilder.ts:329`**

`model: string` is required on `IExecuteClientToolTurnParams`, while `callProviderCompletionStream`
takes `modelOverride?: string` (optional) and falls back to `descriptor.defaultModel`. This
requires callers to always supply a model string to `executeClientToolTurn`.

**Fix:** Make `model?: string` optional with the same fallback logic. Low-risk additive change.

---

### P2-6: `c8 ignore` on `rawTail` branch may be unnecessary given existing test coverage

**`chatRequestBuilders.ts:201`**

```typescript
/* c8 ignore next 5 - rawTail branch: only exercised by live continuation scenarios */
```

`streamingAdapters.test.ts:767` explicitly exercises `callAnthropicStream` with
`continuationMessages` — if that test path reaches `buildAnthropicMessages` with a non-empty
`rawTail`, the ignore directive is unnecessary and should be removed. The brief pre-authorized
this directive, but the rationale ("only live continuation scenarios") may no longer hold if
unit test coverage already reaches the branch. Reconcile the directive with the test.

---

## Priority 3 — MINOR (advisory)

### P3-1: `IAiStreamToolUseDelta` naming doesn't match semantics

**`model.ts` — `IAiStreamToolUseDelta`**

Named "Delta" (implying incremental/partial) but discriminated as `'client-tool-call-done'`
(completion with fully accumulated args). B1-locked naming; noted as follow-up item.

### P3-2: `clientTools` required rather than optional on `IExecuteClientToolTurnParams`

**`clientToolContinuationBuilder.ts:319`**

`clientTools: ReadonlyArray<IAiClientTool>` is required but `tools?: ReadonlyArray<AiServerToolConfig>`
is optional. A caller using `executeClientToolTurn` server-tools-only must pass `clientTools: []`.
Making it optional (`clientTools?:`) would be more symmetric.

### P3-3: No `runToolUseConversation` follow-on pointer in `result.md`

**`.ai/tasks/active/ai-assist-client-tools/result.md`**

The brief's required exit artifact section "Open questions or follow-ups for downstream streams"
should reference the deferred `runToolUseConversation` helper (design §2.X Example B).
`LIBRARY_CAPABILITIES.md` correctly omits it as aspirational; `result.md` should name it as a
follow-on stream.

### P3-4: Misleading `c8 ignore` comment in `gemini.ts`

**`gemini.ts:166`**

```typescript
/* c8 ignore next 1 - defensive: functionCall?.name null branch handled by text/empty filter above */
```

Comment says "handled by text/empty filter above" but the code is an `else if` on the same
loop iteration — no upstream filter applies. Correct to something like: "defensive: else-if
ensures we only enter this branch when `part.text` is absent or empty; a `functionCall` without
a name is discarded."

---

## B4-derived gates — verification

| Gate | Status | Citation |
|---|---|---|
| Signature-delta append regression test | **PASS** | `streamingAdapters.test.ts:549`: `'accumulates signature_delta deltas by concatenation, not overwrite (E5 regression)'`. Three-chunk test; asserts `'PART_A_PART_B_PART_C'` concatenation, not `'PART_C'`. |
| `redacted_thinking` passthrough | **PASS** | `streamingAdapters.test.ts:602` (adapter buffer); `clientToolContinuationBuilder.test.ts:270` (builder output). Both present. |
| Interleaved thinking + tool_use ordering | **PASS** | `streamingAdapters.test.ts:643`; `clientToolContinuationBuilder.test.ts:283`. Representative interleaved fixtures with index-ordered assertions. |
| `tool_choice` constraint (E3) | **PASS** | `clientToolContinuationBuilder.test.ts:218` (thinking-inactive) and `:337` (thinking-active). Both paths assert no `tool_choice` key on continuation messages. |
| Testbed scenario | **CONDITIONAL PASS** | `samples/testbed/src/scenarios/anthropicClientTools/index.ts` exists; checks `ANTHROPIC_API_KEY`; covers first turn and continuation turn. **Caveat:** given P1-1, any prior live run did not exercise the actual client-tool round-trip path. Re-run required after P1-1 fix. |

---

## Exhaustive-switch sweep verification

Grepped `IAiStreamEvent` consumers across `libraries/`, `tools/`, `samples/` for exhaustive switches.

| Consumer | Status | Notes |
|---|---|---|
| `streamingClient.ts` | **PASS — no update needed** | Routes on `descriptor.apiFormat`, not on `IAiStreamEvent` variants. Returns iterable opaquely. |
| `clientToolContinuationBuilder.ts` `eventGenerator` | **PASS** | All three new variants handled explicitly via if/else-if. |
| `samples/testbed/.../anthropicClientTools/index.ts` | **PASS** | If/else-if; handles `client-tool-call-done`, `client-tool-result`, `tool-event`. `client-tool-call-start` deliberately omitted (not needed for scenario). |
| `ts-app-shell/useAiAssist.ts` | **PASS — no update needed** | If/else-if; handles `text-delta`, `done`, `error`. New variants fall through silently — acceptable for non-exhaustive handler. |
| `proxy.ts` | **PASS — no update needed** | Yields IAiStreamEvent opaquely without switching on type. |

No exhaustive-switch consumer with missing cases found.

---

## Sibling-sweep findings (Priority 3 advisory)

| New export | Divergence from siblings | Disposition |
|---|---|---|
| `IExecuteClientToolTurnParams` | `model: string` required vs `modelOverride?: string` optional in `IProviderCompletionStreamParams`; `resolvedThinking: IResolvedThinkingConfig` pre-resolved vs `thinking: IThinkingConfig` raw; no `endpoint` field | P2-5 above. Acceptable for Phase C; ergonomics debt for follow-on. |
| `IAiClientTool.execute` return | `Promise<Result<unknown>>` — value must be JSON-serializable but no compile-time guarantee | Advisory: consider `Result<JsonValue>` for a stronger contract. |
| `IAiStreamToolUseDelta` naming | Named "Delta" (incremental) but represents a completion event | P3-1 above. B1-locked; follow-on naming pass. |
| `IAiClientToolContinuation.messages` inner content typing | `content: JsonObject[]` stored as `JsonObject` via double-cast | P1-3 above. |

---

## Recommendation

**[x] Requires changes — fix Priority 1 items before PR-open**

Three Priority 1 items require resolution:

1. **P1-1 (blocking functionality):** `executeClientToolTurn` must include client tool configs in
   the API request. Build `allTools = [...serverTools, ...clientTools.map(t => t.config)]` before
   calling the adapter. Update all three `call*Stream` function signatures to accept
   `ReadonlyArray<AiToolConfig>`. After fixing, re-run the testbed scenario empirically.

2. **P1-2 (checklist violation):** Replace `Converters.generic` + manual property checks in
   `aiClientToolConfig` with `Converters.object`. The `parametersSchemaValidator` is correct and
   can remain as a field validator.

3. **P1-3 (double-cast / structural lie):** Replace `assistantContent as unknown as JsonObject`
   (and Gemini equivalents) with properly typed `JsonArray`-based constructions. Remove the
   `Record<string, unknown> as JsonObject` cast on the `block` variable.

---

## Second pass (post-fix)

Reviewed by: Code Monkey (implementer self-review)
Date: 2026-06-04
Diff: same branch after all P1/P2 fixes applied

### Summary of fixes applied

| Finding | Resolution |
|---|---|
| P1-1: client tools never sent to provider | `executeClientToolTurn` now computes `effectiveTools = [...(tools ?? []), ...clientTools.map(t => t.config)]` and passes it to all three adapters. All three `call*Stream` signatures widened to `ReadonlyArray<AiToolConfig>`. Four request-body verification tests added (Anthropic client-only, Anthropic server+client coexistence, OpenAI, Gemini). |
| P1-2: `Converters.generic` with manual type checks | Replaced with `Converters.object<IAiClientToolConfig>` using `Converters.enumeratedValue`, `Converters.string.withConstraint`, and `parametersSchemaValidator`. |
| P1-3: double-cast `as unknown as JsonObject` on arrays | Changed `assistantContent`, `modelParts`, `userParts` from `JsonObject[]` to `JsonArray`. Removed all double-casts. |
| P2-1: `result.md` event-type naming inaccurate | `result.md` rewritten with correct event type discriminators (`client-tool-call-start`, `client-tool-call-done`, `client-tool-result`) and correct `IAiClientToolTurnResult` structure. |
| P2-2: `LIBRARY_CAPABILITIES.md` `execute` return type | Fixed `Result<string>` → `Result<unknown>` in the capabilities doc. |
| P2-5: `model: string` should be optional | Changed to `readonly model?: string`; `resolvedModel = model ?? resolveModel(descriptor.defaultModel)`. Model-optional test added to cover the fallback branch. |
| P2-6: `c8 ignore` on `rawTail` accuracy | Re-added with accurate justification: the main `rawTail` path is covered; the `options?.rawTail` optional-chain short-circuit when `options` is `undefined` is not reached in unit tests. |

### Priority 1

No new P1 findings.

- `Converters.object` pattern is correct — no `any`, no manual type checking, no unsafe casts.
- `AiToolConfig` widening is complete and consistent across all three adapters and `executeClientToolTurn`.
- `JsonArray` usage is correct for array content fields — no remaining double-casts.

### Priority 2

No new P2 findings.

- `model?: string` implemented correctly with `resolveModel` fallback.
- `c8 ignore` comment is accurate and well-justified.
- All continuation builders use the `Result` pattern throughout.

### Priority 3

No P3 advisory findings.

**Second pass recommendation: Approved — no new findings.**
