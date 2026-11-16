[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AnthropicThinkingModelNames

# Type Alias: AnthropicThinkingModelNames

> **AnthropicThinkingModelNames** = `"claude-sonnet-4-5"` \| `"claude-sonnet-4-6"` \| `"claude-sonnet-5"` \| `"claude-sonnet-5-5"` \| `"claude-haiku-5-5"` \| `"claude-opus-4-6"` \| `"claude-opus-4-7"` \| `"claude-opus-4-8"` \| `"claude-opus-5"` \| `"claude-opus-5-5"` \| `"claude-fable-5"` \| `"claude-fable-5-1"` \| `"claude-fable-5-2"` \| `"claude-mythos-5-1"` \| `"claude-mythos-5-2"`

Model IDs for Anthropic thinking-capable models.

## Remarks

Only thinking-capable lines are listed. The non-tier `@anthropic:haiku` alias (reachable via
`modelOverride` only) is deliberately omitted — it is not documented as thinking-capable, so
naming it in a thinking-model filter would be misleading. The Fable ids (`claude-fable-5-2` is the
`@anthropic:fable` non-tier alias, reachable via `modelOverride`) are thinking-capable, so they are
listed; so are `claude-mythos-5-1` and `claude-mythos-5-2`, which no alias reaches but which are
documented adaptive-thinking models (covered by `adaptiveThinkingModelPrefixes`).
