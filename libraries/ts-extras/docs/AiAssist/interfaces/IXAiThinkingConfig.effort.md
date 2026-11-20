[Home](../../README.md) > [AiAssist](../README.md) > [IXAiThinkingConfig](./IXAiThinkingConfig.md) > effort

## IXAiThinkingConfig.effort property

xAI reasoning effort. Maps 1:1 to `reasoning_effort` on the wire.
For grok-4, the adapter omits this field (grok-4 always reasons and
rejects the parameter).

**Signature:**

```typescript
readonly effort: "none" | "high" | "low" | "medium";
```
