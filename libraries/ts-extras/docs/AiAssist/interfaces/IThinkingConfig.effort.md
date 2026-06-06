[Home](../../README.md) > [AiAssist](../README.md) > [IThinkingConfig](./IThinkingConfig.md) > effort

## IThinkingConfig.effort property

Cross-provider effort level. Common-subset mapping:
- 'low': Anthropic effort:low | OpenAI effort:low | Gemini thinkingBudget:1024 | xAI reasoning_effort:low
- 'medium': effort:medium | effort:medium | thinkingBudget:4096 | reasoning_effort:medium
- 'high': effort:high | effort:high | thinkingBudget:8192 | reasoning_effort:high

**Signature:**

```typescript
readonly effort: "high" | "low" | "medium";
```
