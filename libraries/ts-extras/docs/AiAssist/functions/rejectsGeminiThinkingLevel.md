[Home](../../README.md) > [AiAssist](../README.md) > rejectsGeminiThinkingLevel

# Function: rejectsGeminiThinkingLevel

Whether a concrete (already-resolved) Gemini model rejects `thinkingLevel` altogether, per the
descriptor's AiAssist.IAiProviderDescriptor.geminiThinkingLevelRejectedModelPrefixes
(exact-or-dash-bounded match).

## Signature

```typescript
function rejectsGeminiThinkingLevel(descriptor: IAiProviderDescriptor, modelId: string): boolean
```
