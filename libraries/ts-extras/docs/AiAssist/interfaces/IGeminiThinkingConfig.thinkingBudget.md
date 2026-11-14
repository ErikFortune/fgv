[Home](../../README.md) > [AiAssist](../README.md) > [IGeminiThinkingConfig](./IGeminiThinkingConfig.md) > thinkingBudget

## IGeminiThinkingConfig.thinkingBudget property

Token budget for thinking. Maps 1:1 to `thinkingBudget` on the wire.
- 0: disable thinking (Flash and Flash-Lite only; error on Pro)
- positive integer: soft token cap
- -1: dynamic
- omitted: model default

**Signature:**

```typescript
readonly thinkingBudget: number;
```
