[Home](../README.md) > [IAnthropicThinkingConfig](./IAnthropicThinkingConfig.md) > effort

## IAnthropicThinkingConfig.effort property

Anthropic effort level, emitted as one of **two** wire shapes chosen by
AiAssist.isAdaptiveThinkingModel:

- **Claude 5 family** (`claude-sonnet-5`, `claude-opus-5`, `claude-fable-5`
  — which includes the `base` and `advanced` tiers, so this is the default
  path): an adaptive `thinking` block plus an `output_config` block
  carrying `effort`. The effort string goes on the wire verbatim and
  **no token budget is sent**.
- **Older thinking-capable models**: an enabled `thinking` block carrying
  `budget_tokens`, converted by `anthropicEffortToBudgetTokens` — low =
  2048, medium = 8192, high = 24000, max = 32000.

So the budget mapping is not a description of what a default Anthropic
call sends; size a budget from it only when you have pinned a pre-Claude-5
model.

`'max'` is accepted on every thinking-capable model here — the library
applies no model restriction of its own, and whether a given model accepts
it is the provider's to enforce.

**Signature:**

```typescript
readonly effort: "max" | "high" | "low" | "medium";
```
