[Home](../../README.md) > [AiAssist](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > maxTokens

## IExecuteClientToolTurnParams.maxTokens property

Optional cap on generated output tokens, mapped to each provider's native field:
Anthropic `max_tokens`, OpenAI/xAI Responses `max_output_tokens` (client-tool turns always
route OpenAI through the Responses API), Gemini `generationConfig.maxOutputTokens`. When
unset, every provider except Anthropic omits the field and applies its own default;
Anthropic's Messages API requires the field, so it falls back to
`DEFAULT_ANTHROPIC_MAX_TOKENS`.

**Signature:**

```typescript
readonly maxTokens: number;
```
