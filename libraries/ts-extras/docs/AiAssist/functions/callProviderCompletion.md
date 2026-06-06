[Home](../../README.md) > [AiAssist](../README.md) > callProviderCompletion

# Function: callProviderCompletion

Calls the appropriate chat completion API for a given provider.
Routes by `apiFormat`: `'openai'` (xAI/OpenAI/Groq/Mistral — switches to Responses API when
tools are set), `'anthropic'`, or `'gemini'`.

## Signature

```typescript
function callProviderCompletion(params: IProviderCompletionParams): Promise<Result<IAiCompletionResponse>>
```
