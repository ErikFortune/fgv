[Home](../../README.md) > [AiAssist](../README.md) > resolveAnthropicThinkingOffType

# Function: resolveAnthropicThinkingOffType

The `thinking.type` that turns thinking off on a concrete (already-resolved) Anthropic model, per
the descriptor's IAiProviderDescriptor.anthropicThinkingOffTypes (exact-or-dash-bounded
match, first rule wins).

## Signature

```typescript
function resolveAnthropicThinkingOffType(descriptor: IAiProviderDescriptor, modelId: string): AnthropicThinkingOffType
```
