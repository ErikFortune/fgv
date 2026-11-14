[Home](../../README.md) > [AiAssist](../README.md) > [IProviderCompletionParams](./IProviderCompletionParams.md) > maxTokens

## IProviderCompletionParams.maxTokens property

Optional cap on generated output tokens, mapped to each provider's native field:
Anthropic `max_tokens`, OpenAI/xAI Responses `max_output_tokens`, Gemini
`generationConfig.maxOutputTokens`, and on the chat-completions path the descriptor's
`chatOutputTokensField` (`max_completion_tokens` for OpenAI, Groq and xAI; `max_tokens` for
Mistral, Ollama and `openai-compat`). When unset,
every provider except Anthropic omits the field and applies its own default; Anthropic's
Messages API requires the field, so it falls back to `DEFAULT_ANTHROPIC_MAX_TOKENS`.

**Signature:**

```typescript
readonly maxTokens: number;
```
