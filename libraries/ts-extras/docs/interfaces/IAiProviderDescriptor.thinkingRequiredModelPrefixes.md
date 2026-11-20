[Home](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > thinkingRequiredModelPrefixes

## IAiProviderDescriptor.thinkingRequiredModelPrefixes property

Concrete model ids (exact-or-dash-bounded-prefix-matched, like
IAiProviderDescriptor.adaptiveThinkingModelPrefixes) that cannot run with thinking off.
The provider rejects the off value ai-assist would send for a generic `effort: 'none'`:
`reasoning_effort: 'none'` (OpenAI, xAI), `thinkingBudget: 0` (Gemini on the budget wire; on
the level wire, a model with no `'minimal'` level — see
AiAssist.IAiProviderDescriptor.geminiThinkingLevels), or the model's off
`thinking` value (Anthropic adaptive-thinking models; see
IAiProviderDescriptor.anthropicThinkingOffTypes). A model that accepts the off value but
ignores it, still thinking, is listed too, so that `'none'` never claims an effect it lacks.

**Signature:**

```typescript
readonly thinkingRequiredModelPrefixes: readonly string[];
```
