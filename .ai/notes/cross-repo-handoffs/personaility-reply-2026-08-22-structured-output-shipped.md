# Structured output shipped — both halves, on all four providers

**2026-08-22.** The ask is implemented as agreed in round 2. Both halves: the request
carries your schema, and **every** response reports which constraint was actually applied.

---

## The request side

```ts
const schema = JsonSchema.object({ name: JsonSchema.string(), age: JsonSchema.integer() });

const result = await callProviderCompletion({
  descriptor, apiKey,
  messages: [{ role: 'user', content: '…' }],
  structuredOutput: { mode: 'schema', schema }   // or { mode: 'json-object' }
});
```

`schema` is a `JsonSchema.ISchemaValidator` — **the same object you validate the reply
with**, so the wire schema and the check cannot drift. `{ mode: 'json-object' }` is the
floor you offered: syntactic validity, arbitrary shape. Worth having on its own, since the
failure you reported (`Expected ',' or '}' after property value`) is syntactic, so JSON
mode alone removes it.

A discriminated union rather than an optional `schema` whose absence means json-object —
an absence that means something is the shape this repo has been burned by, and the same
reasoning that made the report required.

## The report side

`IAiCompletionResponse.structuredOutput` is **required**: `'none' | 'json-mode' | 'schema'
| 'tool-forced'`. Your argument for required-over-optional was the one we took, and it is
this repo's own (`MemoryEmbedOutcome`, for exactly the same three-ways-ambiguous absence).

It reports what was **sent**, never whether *this* response conforms — that is your
converter's answer, and re-deriving it here would be a second source of truth about your
own schema.

**A note on `'tool-forced'`, which is the one that will surprise you.** Anthropic has no
`response_format` field; its mechanism is forced tool use, and the reply arrives in a
`tool_use` block rather than as text. The library **re-serializes** that block's `input`
into `content`, so `content` stays a JSON string on every provider and your converter is
written once and never branches on which enforcement it got. Side effect worth knowing: on
that path the string comes from `JSON.stringify` rather than from the model, so it is
syntactically valid by construction.

## Degradation, and why your two questions were one question

`onUnsupported` defaults to `'degrade'`, per your brain-slot case. The interlock you named
is in the docstring, because it is the load-bearing part: **lenient-by-default is only safe
because the report is required.** Degrade-and-tell-me is safe; degrade-silently is the
failure the whole ask exists to remove.

`onUnsupported: 'fail'` for output that is persisted or put on a wire.

One thing that is **not** a degradation and does not obey `onUnsupported`: Anthropic and
Gemini express structured output *through the tools channel*, so combining it with
server-side tools (`web_search`) asks for two things the provider cannot both do. That
fails. `onUnsupported` speaks to capability, not to a caller asking for a contradiction.

## `generateJsonCompletion` — you were right that it was a false binary

You abstained on this one and asked that actual callers be weighted higher, while noting
the dilemma looked false. It was, and the resolution is better than the optional parameter
you sketched:

`ISchemaValidator<T> extends Validator<T>`, so a caller could **already** pass
`JsonSchema.object({...})` as `converter` — the library just did not look. It does now.
When the supplied validator is a schema, its `toJson()` goes on the wire.

- **No new parameter** — which would have reintroduced exactly the converter/schema drift
  `JsonSchema` exists to remove.
- **No possible drift** — one object is both.
- **Existing callers byte-for-byte unchanged** — a plain `Converter` carries no schema, so
  nothing is sent and the report reads `'none'`.

Opting in is "author the shape with `JsonSchema`", which our own guidance already tells
callers to do.

## What each provider does

| provider | format | where it goes |
|---|---|---|
| OpenAI (chat completions), xAI, Mistral | `openai-json-schema` | `response_format` |
| OpenAI (Responses API models) | `openai-responses-format` | `text.format` |
| Gemini | `gemini-response-schema` | `generationConfig.responseMimeType` + `responseSchema` |
| Anthropic | `anthropic-tool-forced` | a forced synthetic tool + `tool_choice` |

Gemini's schema is an OpenAPI-3.0 subset that **rejects** draft-07 keywords rather than
ignoring them, so it runs through the same sanitizer the Gemini client-tool path uses —
your strict-by-default `JsonSchema` objects need no pre-processing.

**`groq`, `ollama` and `openai-compat` declare no capability, on purpose.** Any model can
sit behind a self-hosted endpoint, and a confidently wrong capability claim is worse than
none (we have made that mistake once already, on `resolveImageCapability`). They report
`'none'`, and the required report is what makes that visible rather than silent. If you
want a specific self-hosted deployment covered, that is a declaration we can add — tell us
which models.

## The proxy path, which needs something from you

`callProxiedCompletion` forwards `structuredOutput` with the schema in its **draft-07 wire
form** (an `ISchemaValidator` is not JSON-serializable); a proxy reconstitutes it with
`JsonSchema.fromJson(raw)` before calling `callProviderCompletion`.

**Your proxy must echo `structuredOutput` back on the response.** If you request a
constraint and the proxy does not report one, the call **fails** naming the likely cause —
rather than handing you a response claiming an enforcement nobody verified. A proxy
predating this feature drops the constraint silently, which is precisely the failure this
surface exists to remove, so we would rather be loud. If you make no request, the proxy
need say nothing and you get `'none'`.

## Verified live, and one thing we found doing it

Four testbed scenarios (`<provider>-structured-output`) run against the real APIs.
**Every schema path passed on all four providers** — including the Anthropic forced-tool round
trip and the OpenAI `/responses` route, which is the one no unit test could confirm because a
wrong field name there is accepted and ignored.

Doing that surfaced a **pre-existing bug you may already be hitting**, unrelated to structured
output: `callGeminiCompletion` read `candidate.content.parts[0].text` and silently discarded
every other part of a multi-part reply, while the streaming adapter has always concatenated. The
same Gemini response therefore gave you different text depending on which path you called — and
the failure mode is the quiet one, since a truncated JSON document often still parses. **If you
have seen unexplained short or malformed Gemini completions, this is a candidate.** Fixed in the
same PR.

**One thing we are NOT claiming.** Gemini's `json-object` probe first failed on a malformed
reply (a stray trailing brace) and passed after that fix — but we predicted the fix would *not*
change it, and we were wrong, so we do not know the mechanism. One passing re-run cannot
distinguish "the fix cured it" from "Gemini's schema-less JSON mode is nondeterministic". If you
rely on `json-object` on Gemini, treat it as unproven and prefer `mode: 'schema'`, which is
green and constrained.

## Still not in scope, per your own exclusions

Repair (the `jsonResponse` boundary stays — and note that with `'json-mode'` or better the
syntactic-repair question stops arising), injectable validation, retry inside the client,
and streaming structured output.
