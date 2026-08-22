[@fgv/ts-extras](../../../README.md) &rsaquo; **ai-assist**

# AI Assist

LLM provider client + JSON-tolerant response handling. Provides `callProviderCompletion` /
`callProviderCompletionStream` (OpenAI, xAI, Anthropic, Gemini), image generation, embeddings,
harness-side client tools (`executeClientToolTurn`), a provider/model registry, and the `AiPrompt`
class. See the [`@fgv/ts-extras/ai-assist` entry in `LIBRARY_CAPABILITIES.md`](../../../../../.ai/instructions/LIBRARY_CAPABILITIES.md)
for the full capability surface.

## Model Aliases (`@<provider>:<role>`)

Provider model snapshots churn — Google retires `gemini-2.5-flash`, OpenAI's undated `gpt-4o` is not
reasoning-capable, etc. The alias layer puts **one fgv-owned indirection** between the model string a
consumer (or `defaultModel`) references and the concrete id that goes to the wire, so a line rotation
is a single central edit rather than a hunt-and-replace across consumers.

### The scheme

A model string is an fgv alias **iff it begins with the `@` sigil** (`MODEL_ALIAS_SIGIL`). The shape is
`@<providerId>:<role>` — e.g. `@google-gemini:flash`, `@openai:reasoning`. `<role>` is a short,
fgv-stable token (`flash`, `pro`, `flash-image`, `embedding`, …) that outlives provider snapshots.

```typescript
// Registered today (each provider descriptor's `aliases` map):
'@google-gemini:flash'  ->  'gemini-3.5-flash'   // fgv alias → concrete id
'@openai:flagship'      ->  'gpt-5.6-terra'
'@anthropic:opus'       ->  'claude-opus-5'

// When an RHS is itself a provider-native undated alias rather than a dated snapshot, resolution
// follows one further `@fgv-alias → provider-native-alias` hop (cycle-guarded).
```

- **Raw-id passthrough (back-compat is structural).** Any string **without** a leading `@` is returned
  verbatim — every existing `defaultModel`, every `modelOverride`, dated snapshots, and self-hosted
  `model:tag` ids (`llama3.2:3b`) pass through untouched. The `@` sigil was chosen precisely so the
  `:`-in-id ids of Ollama / openai-compat are never mis-parsed as aliases.
- **Registry-gated, fails loudly.** An `@`-prefixed string that is not a registered alias fails with a
  `Result.fail` naming the provider and alias — a typo or unknown alias never reaches the wire silently.

### The map lives on the descriptor

The alias map is an optional `aliases?: IModelAliasMap` field on `IAiProviderDescriptor`, alongside the
existing `imageGeneration` / `embedding` capability arrays. It travels with custom descriptors a
consumer constructs; absence means "this provider defines no aliases" (the layer is inert).

```typescript
export interface IModelAliasMap {
  readonly [alias: string]: string;
}
```

### Resolving

| Function | Use for |
|---|---|
| `resolveModelAlias(descriptor, model)` | Resolve a single (possibly-aliased) string. No `@` → verbatim. `@` + registered → target, following the `@`-alias chain (one hop is typical; an alias may target another `@`-alias) until a non-`@` id is reached; cycle-guarded. `@` + unregistered → loud fail. |
| `resolveProviderModel(descriptor, modelOverride, context?)` | The call-time chokepoint: the `ModelSpecKey` walk (`resolveModel`) **then** `resolveModelAlias`. Used by the completion, streaming, image, embedding, and client-tool paths. |

Resolution is **call-time**, not registry-build-time, so the registry stays a pure inspectable data
structure and the proxy path resolves server-side via the reconstructed descriptor.

## Quality Tiers (`base` / `advanced` / `frontier`)

On top of the alias layer sits **one cross-provider quality axis** for completions. A caller asks for a
tier and the registry picks the right *completion model* for that provider — a `base` request lands on a
cheap/fast model, `advanced` on the flagship, `frontier` on the top-of-line model. The tier names are
provider-agnostic; each descriptor's `defaultModel` map wires the tier slot to a provider-specific alias.

### The axis and the request param

`ModelSpecKey` is `'base' | 'advanced' | 'frontier' | 'image' | 'embedding'`. The three tier keys are the
**only** completion-model selectors; `image`/`embedding` select the non-completion modalities. A completion
or streaming call takes an optional `tier?: 'advanced' | 'frontier'` request param:

```typescript
// base (the default — omit tier, or the model floor when a tier isn't present):
await AiAssist.callProviderCompletion({ descriptor, apiKey, request });
// advanced / frontier — the tier drives which completion model is selected:
await AiAssist.callProviderCompletion({ descriptor, apiKey, request, tier: 'advanced' });
await AiAssist.callProviderCompletionStream({ descriptor, apiKey, request, tier: 'frontier' });
```

`base` is the required floor: every descriptor defines it, and it is the universal fallback (see the
cascade below). Omitting `tier` resolves `base`.

### The cascade — `frontier → advanced → base`

A tier request walks an **ordered fallback list** and takes the first key present on the descriptor:

| Requested tier | Fallback order | Notes |
|---|---|---|
| `frontier` | `frontier → advanced → base` | a descriptor with no `frontier` key cascades to `advanced` |
| `advanced` | `advanced → base` | a descriptor with no `advanced` key cascades to `base` |
| `base` | `base` | always present |

This is why a provider only needs to declare the tiers it actually differentiates. OpenAI wires all
three tiers (`frontier` → `gpt-5.6-sol`, which works on chat completions); Anthropic and Gemini omit
`frontier`, so a `frontier` request cascades to their `advanced` model (opus / pro). (The previous
frontier target `gpt-5.5-pro` is Responses-API-only; it remains reachable via `modelOverride` and is
routed to the Responses API via `responsesOnlyModelPrefixes`.)
`image`/`embedding` are unaffected — they keep their flat `modality → base` behavior.

### Composition — thinking and tools are orthogonal, not selectors

The quality tier is the **only** thing that selects a completion model. **Thinking** (reasoning effort)
and **tools** (server-side tools) are orthogonal request/capability concerns that ride *on top of*
whatever model the tier picked — they never participate in model selection:

- **Thinking** stays a per-request API param. `tier: 'base'` + a thinking config resolves the cheap base
  model and sends the thinking param to it; `tier: 'advanced'` + thinking resolves the advanced model and
  sends the same param. Every base model is thinking-capable, so thinking composes with any tier with zero
  capability checks. (Callers who previously relied on Gemini routing *all* thinking calls to Pro now ask
  for `tier: 'advanced'` explicitly — the same knob every other provider uses.)
- **Tools** stay a capability + a per-request `tools[]` list, detected via the `idPattern` axis, never a
  model selector.

`ModelSpecKey` therefore carries **no** `thinking`/`tools` keys — they were removed when the tier axis
landed. A `frontier + thinking` request is simply a frontier-tier completion with the thinking param set;
there is no 2-D selection and no competition between the axes.

### Cross-provider tier table

| slot | OpenAI | Anthropic | Gemini |
|---|---|---|---|
| `base` | `@openai:mini` → `gpt-5.6-luna` | `@anthropic:sonnet` → `claude-sonnet-5` | `@google-gemini:flash` → `gemini-3.5-flash` |
| `advanced` | `@openai:flagship` → `gpt-5.6-terra` | `@anthropic:opus` → `claude-opus-5` | `@google-gemini:pro` → `gemini-3.1-pro-preview` |
| `frontier` | `@openai:pro` → `gpt-5.6-sol` | *(unset → advanced/opus)* | *(unset → advanced/pro)* |

### Maintenance loop — one map edit + a testbed run

When a provider bumps a line (e.g. `gemini-3.5-flash` → `gemini-4-flash`) or re-slots a tier:

1. **Edit one value.** For a line rotation, edit the map value in that descriptor's `aliases`
   (`registry.ts`). For a tier re-slot (e.g. promoting a model to `advanced`), edit the one `defaultModel`
   slot → alias mapping — no alias rename, so no ripple to `modelOverride` callers.
2. **Run the per-provider testbed scenario** against the live API to confirm the new id answers.

Zero consumer changes; consumers and `defaultModel` reference the stable alias / tier slot. The testbed
scenario is the standing canary — it exercises each tier, pins the alias, and logs the resolved concrete
id (`resolved @google-gemini:pro -> gemini-3.1-pro-preview`), so a green run proves each tier maps to a
model that actually answers, and a frontier request logs the cascade target as live cascade proof.

### What the alias layer does NOT cover

It fixes **selection/default churn** only. Two axes remain manual on a provider line rotation (see
`docs/TECH_DEBT.md`):

1. **Capability-detection `idPattern` rules** (`registry.ts`) — classify the concrete ids a provider's
   list endpoint returns; a new line needs a matching `idPattern` sibling or it is mis-classified.
2. **The typed `*ModelNames` unions** (`GeminiThinkingModelNames`, etc.) used by the layered-options
   `models?` filters — enumerate concrete ids for compile-time ergonomics and must track real ids.

### Gemini defaults (first migrated provider)

`google-gemini`'s `defaultModel` references aliases that resolve to the Gemini 3.x line:

| Alias | Resolves to | Role / tier slot |
|---|---|---|
| `@google-gemini:flash` | `gemini-3.5-flash` | `base` |
| `@google-gemini:pro` | `gemini-3.1-pro-preview` | `advanced` (also the `frontier` cascade target) |
| `@google-gemini:flash-image` | `gemini-3.1-flash-image` | `image` |
| `@google-gemini:embedding` | `gemini-embedding-001` | `embedding` |
| `@google-gemini:flash-lite` | `gemini-3.1-flash-lite` | non-tier role (`modelOverride` only) |

The per-role version split (flash base at 3.5, the rest at 3.1) is from Google's deprecation table —
consumers reference the role alias and never see these numbers. OpenAI and Anthropic have since adopted
the scheme with the same tier vocabulary (see the cross-provider tier table above). Note the `pro` role
serves both the `advanced` slot and (via the cascade) `frontier`, which is exactly why alias roles are
model-line-semantic rather than tier-named — one role can back multiple slots without duplication.

## Structured output

Every completion request takes an optional `structuredOutput`, which asks the
**provider** to constrain its output rather than only asking the model in the prompt.

```ts
const schema = JsonSchema.object({ name: JsonSchema.string(), age: JsonSchema.integer() });

const result = await callProviderCompletion({
  descriptor, apiKey,
  messages: [{ role: 'user', content: 'Describe the subject.' }],
  structuredOutput: { mode: 'schema', schema }
});

result.onSuccess((r) => {
  r.structuredOutput; // 'schema' | 'json-mode' | 'tool-forced' | 'none'
  return schema.validate(JSON.parse(r.content));
});
```

Two modes. `{ mode: 'schema', schema }` constrains generation to the schema;
`{ mode: 'json-object' }` asks only for syntactically valid JSON of arbitrary shape.
The weaker one is worth having on its own — the failure that motivated this surface
(`Expected ',' or '}' after property value`, an unescaped quote closing a string
early) is **syntactic**, so JSON mode removes it. Schema constraint is what
additionally buys shape.

**The schema is the same object you validate with**, so the wire schema and the
check cannot drift. This is the cloud sibling of `@fgv/ts-extras-ollama`'s
`chatStructured`.

### The report is required, and that is the design

`IAiCompletionResponse.structuredOutput` is **not optional**. Three questions hide
inside *"did it honour my schema"*, and they have different owners:

| question | answerable by |
|---|---|
| did we send a constraint? | this client, at request-build time |
| which constraint did the provider apply? | this client, from the resolved model's capability |
| does **this response** conform to my shape? | your converter, and nothing else |

The library answers the first two and deliberately not the third — reporting
conformance would mean re-validating against your own schema to re-derive an answer
you already hold.

It has to ride on the **response** rather than be a lookup you do yourself, because
`resolveProviderModel` resolves aliases and tiers at *call* time and a `tier` request
can cascade. The concrete model that will serve a request is not knowable to a caller
up front, so requiring one to compute capability from its own side would be unsound.
**You supply intent; the response reports outcome.**

And it is required rather than optional because an optional field makes absence
three-ways ambiguous — no capability / not requested / a build predating the feature
— which is the exact thing the report exists to disambiguate. `'none'` already says
*"no constraint sent"*, so always-present costs nothing.

### Degradation is caller-chosen, lenient by default

`onUnsupported` defaults to `'degrade'`. **That is only safe because the report is
required** — degrade-and-tell-me is safe; degrade-silently is the failure this whole
surface exists to remove. The two are one decision, not two independent ones.

Pass `onUnsupported: 'fail'` when the output is persisted or put on a wire, where an
unconstrained generation that happens to parse is worse than an error because it is
wrong quietly. Leave it at `'degrade'` on paths *designed* to degrade — an extractor
that may return nothing, a segmenter that floors to a mechanical chunker — where a
hard failure would make this library less safe than the code it replaces.

A **conflict** is not a degradation and does not obey `onUnsupported`: Anthropic and
Gemini express structured output through the tools channel, so combining it with
server-side tools asks for two things the provider cannot both do, and that fails.

### Four wire formats, declared per model family

`IAiProviderDescriptor.structuredOutput` is longest-prefix matched **after** alias
resolution, exactly like `imageGeneration` and `embedding`.

| format | where the constraint goes |
|---|---|
| `openai-json-schema` | `body.response_format` |
| `openai-responses-format` | `body.text.format` |
| `gemini-response-schema` | `generationConfig.responseMimeType` + `responseSchema` |
| `anthropic-tool-forced` | a forced synthetic tool + `tool_choice` |

Gemini's schema is an OpenAPI-3.0 subset that **rejects** draft-07 keywords rather
than ignoring them, so the schema goes through the same sanitizer the Gemini tool
path uses.

Anthropic has no response-format field at all. Its mechanism is forced tool use —
which is why `'tool-forced'` is a distinct enforcement value and not a spelling of
`'schema'`: **the reply arrives in a `tool_use` block, not as text.** The library
re-serializes that block's `input` into `content`, so `content` stays a JSON string
on every provider and your converter is written once. A useful side effect: under
this enforcement the string comes from `JSON.stringify`, not from the model, so it is
syntactically valid by construction.

`groq`, `ollama` and `openai-compat` declare **no** capability on purpose. Any model
can sit behind a self-hosted endpoint, and a confidently wrong capability claim is
worse than none — they report `'none'`, and the report is what makes that visible.

### `generateJsonCompletion` adopts it for free

`ISchemaValidator<T> extends Validator<T>`, so a caller could always pass
`JsonSchema.object({...})` as `converter` — the library simply did not look. It does
now: when the supplied validator is a schema, its `toJson()` goes on the wire.

There is deliberately **no new parameter**, which would have reintroduced exactly the
converter/schema drift `JsonSchema` exists to remove. A plain `Converter` carries no
schema, so nothing is sent, the report reads `'none'`, and existing callers are
byte-for-byte unchanged.

### Not in scope

`structuredOutput` is wired into `callProviderCompletion`, `callProxiedCompletion`
and `generateJsonCompletion` only. **The streaming paths do not support it** —
`callProviderCompletionStream`, the streaming adapters, and `executeClientToolTurn`
ignore it, and `IAiStreamDone` carries no enforcement report.

That is a decision, not an oversight, and worth stating because the neighbouring
request surface (`tools`, `thinking`, `maxTokens`) *is* shared across both paths, so
parity is the reasonable expectation. Streaming structured output is a different
problem: the providers impose their own constraints on combining it with incremental
delivery, and a per-chunk report has no obvious meaning. Also out: repair (the
`jsonResponse` boundary stays — with `'json-mode'` or better the syntactic-repair
question stops arising), injectable validation, and retry inside the client.
