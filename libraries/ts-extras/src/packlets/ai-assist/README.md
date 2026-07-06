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
'@openai:flagship'      ->  'gpt-5.5'
'@anthropic:opus'       ->  'claude-opus-4-8'

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

This is why a provider only needs to declare the tiers it actually differentiates. Anthropic and Gemini
omit `frontier`, so a `frontier` request cascades to their `advanced` model (opus / pro); OpenAI declares
all three. `image`/`embedding` are unaffected — they keep their flat `modality → base` behavior.

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
| `base` | `@openai:mini` → `gpt-5.4-mini` | `@anthropic:sonnet` → `claude-sonnet-5` | `@google-gemini:flash` → `gemini-3.5-flash` |
| `advanced` | `@openai:flagship` → `gpt-5.5` | `@anthropic:opus` → `claude-opus-4-8` | `@google-gemini:pro` → `gemini-3.1-pro-preview` |
| `frontier` | `@openai:pro` → `gpt-5.5-pro` | *(unset → advanced/opus)* | *(unset → advanced/pro)* |

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
| `@google-gemini:flash-image` | `gemini-3.1-flash-image-preview` | `image` |
| `@google-gemini:embedding` | `gemini-embedding-001` | `embedding` |
| `@google-gemini:flash-lite` | `gemini-3.1-flash-lite` | non-tier role (`modelOverride` only) |

The per-role version split (flash base at 3.5, the rest at 3.1) is from Google's deprecation table —
consumers reference the role alias and never see these numbers. OpenAI and Anthropic have since adopted
the scheme with the same tier vocabulary (see the cross-provider tier table above). Note the `pro` role
serves both the `advanced` slot and (via the cascade) `frontier`, which is exactly why alias roles are
model-line-semantic rather than tier-named — one role can back multiple slots without duplication.
