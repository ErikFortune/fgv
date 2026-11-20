[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiCompletionResponse

# Interface: IAiCompletionResponse

Result of an AI provider completion call.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | The generated text content |
| <a id="property-structuredoutput"></a> `structuredOutput` | `readonly` | [`StructuredOutputEnforcement`](../type-aliases/StructuredOutputEnforcement.md) | Which structured-output constraint the provider was **asked** to apply. **Remarks** **Required, not optional, and that is the point.** An optional field would make absence three-ways ambiguous — no capability / not requested / a build predating the feature — and disambiguating exactly that is what this field exists for. `'none'` already expresses *"no constraint sent"*, so always-present costs nothing and removes the ambiguity by construction. The same remedy as `MemoryEmbedOutcome` in `@fgv/ts-agent-memory`, applied to the same defect. It reports what was *sent*, never whether **this** response conforms — that is the caller's converter's answer and re-deriving it here would be a second source of truth. See `StructuredOutputEnforcement` for the three-question split. |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` | Whether the response was truncated due to token limits |
| <a id="property-usage"></a> `usage?` | `readonly` | [`IAiCompletionUsage`](IAiCompletionUsage.md) | Token usage, when the provider reports it. |
