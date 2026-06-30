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
'@google-gemini:flash'  ->  'gemini-3.5-flash'           // fgv alias → concrete id
'@anthropic:sonnet'     ->  'claude-sonnet-4-6'          // fgv alias → provider-native undated alias
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
| `resolveModelAlias(descriptor, model)` | Resolve a single (possibly-aliased) string. No `@` → verbatim. `@` + registered → target (following one `@fgv-alias → provider-native-alias` hop; cycle-guarded). `@` + unregistered → loud fail. |
| `resolveProviderModel(descriptor, modelOverride, context?)` | The call-time chokepoint: the `ModelSpecKey` walk (`resolveModel`) **then** `resolveModelAlias`. Used by the completion, streaming, image, embedding, and client-tool paths. |

Resolution is **call-time**, not registry-build-time, so the registry stays a pure inspectable data
structure and the proxy path resolves server-side via the reconstructed descriptor.

### Maintenance loop — one map edit + a testbed run

When a provider bumps a line (e.g. `gemini-3.5-flash` → `gemini-4-flash`):

1. **Edit one map value** in that descriptor's `aliases` (`registry.ts`).
2. **Run the per-provider testbed scenario** against the live API to confirm the new id answers.

Zero consumer changes; zero `defaultModel` changes (both reference the stable alias). The testbed
scenario is the standing canary — it pins the alias (`@google-gemini:flash`) and logs the resolved
concrete id, so a green run proves the alias maps to a model that actually answers.

### What the alias layer does NOT cover

It fixes **selection/default churn** only. Two axes remain manual on a provider line rotation (see
`docs/TECH_DEBT.md`):

1. **Capability-detection `idPattern` rules** (`registry.ts`) — classify the concrete ids a provider's
   list endpoint returns; a new line needs a matching `idPattern` sibling or it is mis-classified.
2. **The typed `*ModelNames` unions** (`GeminiThinkingModelNames`, etc.) used by the layered-options
   `models?` filters — enumerate concrete ids for compile-time ergonomics and must track real ids.

### Gemini defaults (first migrated provider)

`google-gemini`'s `defaultModel` references aliases that resolve to the Gemini 3.x line:

| Alias | Resolves to | Role |
|---|---|---|
| `@google-gemini:flash` | `gemini-3.5-flash` | base |
| `@google-gemini:pro` | `gemini-3.1-pro-preview` | thinking (explicit `thinking` default) |
| `@google-gemini:flash-image` | `gemini-3.1-flash-image-preview` | image |
| `@google-gemini:embedding` | `gemini-embedding-001` | embedding |
| `@google-gemini:flash-lite` | `gemini-3.1-flash-lite` | cheaper thinking tier (`modelOverride` only) |

The per-role version split (flash base at 3.5, the rest at 3.1) is from Google's deprecation table —
consumers reference the role alias and never see these numbers. Other providers adopt the scheme
additively (OpenAI is the next-highest value).
