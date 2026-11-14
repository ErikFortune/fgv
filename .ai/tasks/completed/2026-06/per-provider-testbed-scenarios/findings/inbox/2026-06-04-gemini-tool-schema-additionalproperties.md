# Finding: Gemini client-tool calls fail with HTTP 400 — `toGeminiTools` emits `additionalProperties`, which Gemini's function-declaration schema rejects

**Date:** 2026-06-04
**Surfaced by:** `per-provider-testbed-scenarios` stream — live run of `gemini-client-tools` against the real Gemini API
**Library:** `@fgv/ts-extras/ai-assist`
**Severity:** P1 — client tools are completely non-functional on Gemini (every request with a client tool 400s)
**Disposition:** **RESOLVED** by the `ai-assist-cross-provider-fixes` stream (PR #457, merged 2026-06-05 into the `per-provider-testbed-scenarios` integration branch; promoted to `release` in the cluster-close squash #459) — exactly the "separate additive library fix, same path as PR #454" this finding recommended. `toGeminiTools` now runs each client tool's `parametersSchema.toJson()` through a recursive `@internal` `toGeminiParameterSchema` that strips the draft-07-only keywords Gemini's OpenAPI-3.0 subset rejects (`additionalProperties`, `$schema`). Verified in current source: helper at `toolFormats.ts:228`, wired at the `case 'client_tool':` arm of `toGeminiTools` (`:282`). The stripping is **keyword-aware** rather than depth-blind — a Copilot round-1 finding on #457 caught that the brief's own sketch would have deleted a real tool parameter *named* `additionalProperties` inside a `properties` map; the shipped helper does not.

*Disposition corrected 2026-08-14 by the retroactive `finalize-task` sweep. It had read `OPEN` for roughly ten weeks after the fix shipped. Its two siblings in this inbox were both updated post-hoc with resolution detail; this one was handed to cluster-close and dropped — the fold-in was half-done, with the OpenAI/xAI sibling updated and this one missed.*

---

## What was found

Running the `gemini-client-tools` scenario against the live API fails immediately on the first turn:

```
testbed CLI: scenario "gemini-client-tools" failed: Stream error during first turn: AI streaming API returned 400: {
  "error": {
    "code": 400,
    "message": "Invalid JSON payload received. Unknown name \"additionalProperties\" at 'tools[1].function_declarations[0].parameters': Cannot find field.",
    "status": "INVALID_ARGUMENT",
    ...
  }
}
```

## Root cause

`toGeminiTools` (`libraries/ts-extras/src/packlets/ai-assist/toolFormats.ts:216`) builds each client tool's function declaration as:

```ts
case 'client_tool':
  functionDeclarations.push({
    name: t.name,
    description: t.description,
    parameters: t.parametersSchema.toJson()   // line 229
  } as JsonObject);
  break;
```

`t.parametersSchema` is an `ISchemaValidator` authored via `JsonSchema.object({ ... })`. `JsonSchema` objects are **strict by default**, so `.toJson()` emits a draft-07 schema that includes `additionalProperties: false` (and would include it on every nested object too):

```json
{ "type": "object", "properties": { "key": { "type": "string", ... } }, "required": ["key"], "additionalProperties": false }
```

Gemini's `function_declarations[].parameters` is **not** full JSON Schema — it is a subset of the OpenAPI 3.0 Schema Object. It does **not** recognize `additionalProperties` and rejects the whole payload with `INVALID_ARGUMENT` rather than ignoring the unknown key.

This is provider-dialect divergence the consumer cannot reasonably be expected to handle: the OpenAI Responses path (`toResponsesApiTools`) and the Anthropic path (`toAnthropicTools`) both accept the draft-07 `.toJson()` output as-is, so the same client tool config works on two providers and 400s on the third. The library — which owns the per-provider wire translation — must sanitize the schema for Gemini's subset.

## Why this is a library bug (not a scenario bug)

The scenario authors a perfectly ordinary tool schema (`JsonSchema.object({ key: JsonSchema.string(...) })`) and reuses the *same* `IAiClientTool` shape across all three providers, which is the entire point of the unified `executeClientToolTurn` surface. A consumer should not have to know that Gemini rejects `additionalProperties` while OpenAI and Anthropic tolerate it. The translation seam (`toGeminiTools`) is exactly where the dialect difference belongs.

## Proposed library fix (additive, no consumer-visible change)

In `toGeminiTools`, sanitize the parameters schema to Gemini's accepted subset before embedding it — recursively strip keys Gemini's function-declaration schema does not support. At minimum `additionalProperties`; also defensively `$schema` (draft-07 `.toJson()` may emit it) and any other non-OpenAPI-subset keywords. Recurse through `properties[*]` and `items` so nested objects are sanitized too.

Sketch:

```ts
// Gemini's function-declaration parameters use an OpenAPI 3.0 schema subset that
// rejects (does not ignore) draft-07-only keywords. Strip them recursively.
function toGeminiParameterSchema(schema: JsonValue): JsonValue {
  if (Array.isArray(schema)) {
    return schema.map(toGeminiParameterSchema);
  }
  if (schema !== null && typeof schema === 'object') {
    const out: JsonObject = {};
    for (const [k, v] of Object.entries(schema)) {
      if (k === 'additionalProperties' || k === '$schema') {
        continue;
      }
      out[k] = toGeminiParameterSchema(v);
    }
    return out;
  }
  return schema;
}
```

…and at line 229: `parameters: toGeminiParameterSchema(t.parametersSchema.toJson())`.

Add a unit test asserting the emitted Gemini function declaration contains no `additionalProperties` at any nesting level (including a nested-object schema fixture).

## Impact on this stream

The `gemini-client-tools` scenario cannot reach a successful round-trip until this lands — it 400s before any model output. The OpenAI/xAI scenarios are unaffected by this particular bug (their adapters accept the draft-07 output). Once the library fix lands and this branch rebases, the Gemini scenario's continuation/round-trip gates become reachable for live verification.

This is the second wire-shape bug this stream's scenarios have surfaced (after the Anthropic-only continuation forwarding, fixed in PR #454) — i.e. the empirical safety net working as designed.
