[Home](../../README.md) > [AiAssist](../README.md) > [IThinkingConfig](./IThinkingConfig.md) > effort

## IThinkingConfig.effort property

Cross-provider effort level. Common-subset mapping:
- 'none': Anthropic — the model's thinking-off value (see remarks) | OpenAI effort:none | Gemini thinkingLevel:minimal or thinkingBudget:0 | xAI reasoning_effort:none
- 'low': Anthropic effort:low | OpenAI effort:low | Gemini thinkingLevel:low or thinkingBudget:1024 | xAI reasoning_effort:low
- 'medium': Anthropic effort:medium | OpenAI effort:medium | Gemini thinkingLevel:medium or thinkingBudget:4096 | xAI reasoning_effort:medium
- 'high': Anthropic effort:high | OpenAI effort:high | Gemini thinkingLevel:high or thinkingBudget:8192 | xAI reasoning_effort:high

Gemini takes `thinkingLevel` on the models in AiAssist.IAiProviderDescriptor.geminiThinkingLevels
(where an effort the model does not list is refused) and `thinkingBudget` on every other model.

**Signature:**

```typescript
readonly effort: "none" | "high" | "low" | "medium";
```
