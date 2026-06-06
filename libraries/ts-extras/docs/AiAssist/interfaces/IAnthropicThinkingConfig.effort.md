[Home](../../README.md) > [AiAssist](../README.md) > [IAnthropicThinkingConfig](./IAnthropicThinkingConfig.md) > effort

## IAnthropicThinkingConfig.effort property

Anthropic effort level. The emit-site converts to `thinking.budget_tokens`
(the integer budget the Anthropic API requires). Mapping policy: low = 2048,
medium = 8192, high = 24000, max = 32000.
- 'low' | 'medium' | 'high': all thinking-capable models
- 'max': Opus 4.6 only

**Signature:**

```typescript
readonly effort: "max" | "high" | "low" | "medium";
```
