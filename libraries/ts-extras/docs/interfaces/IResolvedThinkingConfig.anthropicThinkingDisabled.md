[Home](../README.md) > [IResolvedThinkingConfig](./IResolvedThinkingConfig.md) > anthropicThinkingDisabled

## IResolvedThinkingConfig.anthropicThinkingDisabled property

Anthropic: a generic `effort: 'none'` asked for thinking off. On an adaptive-thinking model
(thinking on by default) the emit-site sends the model's off value (`thinking: { type: 'disabled' }`
unless AiAssist.IAiProviderDescriptor.anthropicThinkingOffTypes names another) and no
effort; on an older
model it sends nothing, which is already off. Ignored when IResolvedThinkingConfig.anthropicEffort is set.

**Signature:**

```typescript
readonly anthropicThinkingDisabled: true;
```
