[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AnthropicThinkingOffType

# Type Alias: AnthropicThinkingOffType

> **AnthropicThinkingOffType** = `"disabled"` \| `"between_tools"`

The `thinking.type` an Anthropic adaptive-thinking model is sent to turn thinking off.

## Remarks

`'disabled'` is the default. `'between_tools'` is the off value on a model that rejects
`'disabled'` and instead stops thinking before it responds, while still returning the short
updates it writes between tool calls as thinking blocks.
