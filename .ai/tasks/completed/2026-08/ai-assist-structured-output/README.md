# `ai-assist-structured-output`

**Shipped 2026-08-22.** Additive for readers of `IAiCompletionResponse`, breaking for anyone
*constructing* one (test doubles). PR **#652** into `release`.

---

## The problem, in one sentence

A caller could ask an LLM for JSON only by **saying so in the prompt** — every provider has a
native way to *make* it JSON, and `ai-assist` used none of them; and even once it did, a caller
still could not learn whether the constraint had actually been applied.

The reported failure that opened the stream was syntactic — `Expected ',' or '}' after property
value`, an unescaped quote closing a string early. That matters for the design: a JSON-mode
guarantee is **sufficient to remove it**, and schema constraint is what additionally buys shape.

## The shape

```ts
// request — a discriminated union, not an optional `schema` whose absence means something
type StructuredOutputRequest =
  | { mode: 'schema'; schema: JsonSchema.ISchemaValidator<unknown>; onUnsupported?: 'degrade' | 'fail' }
  | { mode: 'json-object'; onUnsupported?: 'degrade' | 'fail' };

interface IProviderCompletionParams {
  readonly structuredOutput?: StructuredOutputRequest;   // NEW
}

interface IAiCompletionResponse {
  readonly content: string;
  readonly truncated: boolean;
  readonly structuredOutput: StructuredOutputEnforcement;  // NEW — REQUIRED
}

type StructuredOutputEnforcement = 'none' | 'json-mode' | 'schema' | 'tool-forced';
```

Plus `IAiProviderDescriptor.structuredOutput` (per-model-family capability, longest-prefix matched
after alias resolution), `resolveStructuredOutputCapability` / `supportsStructuredOutput`, and
`JsonSchema.isSchemaValidator` in `@fgv/ts-json-base`.

## The three ideas worth carrying forward

**1. The report answers two of three questions, and refusing the third is the design.**
*Did we send a constraint?* — the client knows. *Which constraint did the provider apply?* — the
client knows, from the resolved model's capability. *Does **this** response conform?* — the
caller's converter knows, and nothing else. Reporting the third would re-derive, from the
caller's own schema, an answer the caller already holds.

**2. The report is required, and that is one decision with the lenient default.**
An optional field makes absence three-ways ambiguous — no capability / not requested / a build
predating the feature — which is exactly what the report exists to disambiguate. `'none'` already
says *"nothing sent"*, so always-present costs nothing. And `onUnsupported` defaults to
`'degrade'` **only because** the report is required: degrade-and-tell-me is safe;
degrade-silently is the failure the whole surface exists to remove. The consumer asked those as
two questions. They are one.

**3. It rides on the response because the caller cannot know the model.**
`resolveProviderModel` resolves aliases and tiers at *call* time, and a `tier` request cascades.
A caller computing capability from its own side would be unsound. **You supply intent; the
response reports outcome.**

## Four wire formats, and why `'tool-forced'` is not a spelling of `'schema'`

| format | where the constraint goes |
|---|---|
| `openai-json-schema` | `body.response_format` |
| `openai-responses-format` | `body.text.format` |
| `gemini-response-schema` | `generationConfig.responseMimeType` + `responseSchema` (draft-07-sanitized) |
| `anthropic-tool-forced` | a forced synthetic tool + `tool_choice` |

Anthropic has no response-format field. Its mechanism is forced tool use, and **the reply arrives
in a `tool_use` block rather than as text** — so the library re-serializes that block's `input`
into `content`, keeping `content` a JSON string on every provider and a converter free of
provider branching. A side effect worth knowing: on that path the string comes from
`JSON.stringify`, not from the model, so it is syntactically valid by construction.

`groq` / `ollama` / `openai-compat` declare **nothing**, deliberately. Any model can sit behind a
self-hosted endpoint, and a confidently wrong capability claim is worse than none — the mistake
`resolveImageCapability` made once already, and the reason the resolver is alias-first.

## `generateJsonCompletion` adoption dissolved rather than being decided

The consumer flagged the adopt-or-not question as a probable false binary and was right, but the
resolution beat the optional parameter they sketched. `ISchemaValidator<T> extends Validator<T>`,
so a caller could **already** pass `JsonSchema.object({...})` as `converter` — the library simply
did not look. It does now.

No new parameter (which would have reintroduced exactly the converter/schema drift `JsonSchema`
exists to remove), no possible drift, and plain-`Converter` callers byte-for-byte unchanged
reporting `'none'`.

## Five defects found, and where each came from

The distribution is the interesting part: **no two came from the same layer.**

| # | defect | found by |
|---|---|---|
| 1 | OpenAI wire format is not a function of the model alone — the route depends on server tools, and `response_format` in a `/responses` body is *silently ignored* | re-reading the implementation |
| 2 | `JSON.stringify(undefined)` returns `undefined`, not a string, and does not throw — so a `tool_use` block with no `input` put `undefined` behind a `content: string` contract | re-reading the implementation |
| 3 | `generateJsonCompletion` inferred a schema from `converter` even when `jsonConverter` overrode it — constraining the *request* to a schema unrelated to what validates the *reply* | `code-reviewer` |
| 4 | `_type in SCHEMA_NODE_TYPES` walks the prototype chain — `{ _type: 'constructor' }` would have passed | applying the reviewer's own fix |
| 5 | the non-streaming Gemini adapter read `parts[0].text` and discarded the rest, while the streaming adapter concatenated | **the live testbed run** |

Defects 1 and 2 would each have produced a **confidently wrong report** — the single thing this
feature exists to prevent. Defect 5 is pre-existing and unrelated to this stream; it is bundled
here because this stream's own testbed found it, and its failure mode is the bad kind (a
truncated document that often still *parses*, so a consumer gets a plausible wrong answer rather
than an error).

## Live verification

Four testbed scenarios (`<provider>-structured-output`) run against the real APIs. **All schema
paths green on all four providers.** The OpenAI `/responses` pass is the live confirmation of
defect 1's fix — it establishes `text.format` as the correct field, which no unit test could,
because a wrong field name there is accepted and ignored. The Anthropic pass confirms the
forced-tool round trip.

The probes assert three things rather than "the call succeeded": the reply **parses**, it
**validates against the very schema that was sent**, and the reported enforcement is the one
requested. The prompt is written to be hostile to an unconstrained model — it invites prose, a
code fence, and a field the strict schema forbids.

**One open question, stated rather than closed.** Gemini's `json-object` probe first failed on a
malformed reply and passed after the parts fix — but this stream *predicted that fix would not
change the outcome*, and the prediction was wrong. A single passing re-run cannot distinguish
"the fix cured it" from "Gemini's schema-less JSON mode is nondeterministic and this draw was
clean". See `result.md` § "What the Gemini run found". Do not write it up as cured.

## Artifacts

- `brief.md` — the ask as accepted, with the consumer's round-2 answers
- `result.md` — what shipped, the review findings, the live run, and the correction above
- `meta.yaml` — machine-readable record
