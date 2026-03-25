[Home](../README.md) > callProviderCompletion

# Function: callProviderCompletion

Calls the appropriate chat completion API for a given provider.

Routes based on the provider descriptor's `apiFormat` field:
- `'openai'` for xAI, OpenAI, Groq, Mistral
- `'anthropic'` for Anthropic Claude
- `'gemini'` for Google Gemini

When tools are provided and the provider supports them:
- OpenAI-format providers switch to the Responses API
- Anthropic includes tools in the Messages API request
- Gemini includes Google Search grounding

## Signature

```typescript
function callProviderCompletion(params: IProviderCompletionParams): Promise<Result<IAiCompletionResponse>>
```
