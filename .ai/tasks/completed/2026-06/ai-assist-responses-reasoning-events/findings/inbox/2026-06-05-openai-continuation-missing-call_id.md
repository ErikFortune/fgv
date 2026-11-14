# Finding: OpenAI Responses continuation builder emits `id` instead of required `call_id` on function_call input items

**Date:** 2026-06-05
**Surfaced by:** `ai-assist-responses-reasoning-events` stream — live OpenAI re-run after adapter fix
**Library:** `@fgv/ts-extras/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts`
**Severity:** P1 — blocks the OpenAI / xAI continuation round-trip
**Disposition:** **RESOLVED inline in this stream** (closeout — surprise found mid-loop; brief allows file-and-decide).

---

## What was observed (live)

After the `item_id` correlation fix in `openaiResponses.ts`, the OpenAI scenario's first turn now succeeds and the model fires two `recall_memory` client-tool calls. The continuation request then HTTP-400s:

```
"error": {
  "message": "Missing required parameter: 'input[2].call_id'.",
  "type": "invalid_request_error",
  "param": "input[2].call_id",
  "code": "missing_required_parameter"
}
```

## Root cause

`buildOpenAiContinuation` emits the model-side function_call input item with `id: callId`, omitting the required `call_id` field:

```typescript
items.push({
  type: 'function_call',
  id: callId,              // wrong field
  name: call.name,
  arguments: call.argsBuffer
});
```

Per the OpenAI Responses API spec (`ResponseFunctionToolCall`):
- `call_id: string` — **required**, the `call_*` identifier matched against `function_call_output.call_id`
- `id?: string` — **optional**, the output-item id (`fc_*`) returned in streamed events

The function_call_output item is emitted with `call_id` correctly, but the matching function_call item used `id` instead.

## Why the test suite didn't catch this

`buildOpenAiContinuation`'s unit tests assert `cont.messages[0].id === 'call_abc'` and never look at `cont.messages[0].call_id`. The cluster's prior live runs of OpenAI never reached the continuation step (the first turn never produced a client-tool-call-done event because of the unrelated item_id correlation bug fixed in this stream). With both bugs latent, the OpenAI continuation path had never been exercised end-to-end.

This is the L37 pattern: tests passed on a wire shape that doesn't match the live API contract.

## Disposition

The brief allows surfaces-found-inline to be addressed within the same PR as closeout-scope when they are required to make the acceptance criteria pass. The OpenAI / xAI scenarios cannot reach PASS without this fix, so it lands in the same commit as the adapter fix.

**Fix:** emit `call_id` on the function_call input item (omit the optional `id`). Update unit tests and add an assertion that `call_id` is the matched correlation field.

## Affected packages

- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts`
- `libraries/ts-extras/src/test/unit/ai-assist/clientToolContinuationBuilder.test.ts`
