[Home](../../README.md) > [AiAssist](../README.md) > [IOpenAiThinkingConfig](./IOpenAiThinkingConfig.md) > effort

## IOpenAiThinkingConfig.effort property

OpenAI reasoning effort. Maps 1:1 to the wire field.
- 'none': disables reasoning (gpt-5.x only; rejected by o-series)
- 'minimal': fastest (gpt-5.x)
- 'low' | 'medium' | 'high': standard tiers
- 'xhigh': highest (select gpt-5.x models only)

**Signature:**

```typescript
readonly effort: "none" | "high" | "low" | "medium" | "minimal" | "xhigh";
```
