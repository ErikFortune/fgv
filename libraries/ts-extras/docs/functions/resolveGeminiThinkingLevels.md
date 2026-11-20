[Home](../README.md) > resolveGeminiThinkingLevels

# Function: resolveGeminiThinkingLevels

The thinking levels a concrete (already-resolved) Gemini model accepts, per the descriptor's
AiAssist.IAiProviderDescriptor.geminiThinkingLevels (exact-or-dash-bounded match; when several
rules match, the longest `modelPrefix` wins).

## Signature

```typescript
function resolveGeminiThinkingLevels(descriptor: IAiProviderDescriptor, modelId: string): readonly GeminiThinkingLevel[] | undefined
```
