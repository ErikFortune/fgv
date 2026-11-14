[Home](../../README.md) > [AiAssist](../README.md) > [IThinkingConfig](./IThinkingConfig.md) > onUnsupported

## IThinkingConfig.onUnsupported property

What to do when `effort` is `'none'` and the resolved model cannot run with thinking off
(see IAiProviderDescriptor.thinkingRequiredModelPrefixes).
- `'degrade'` (default): send `'low'`, the least thinking the model accepts.
- `'fail'`: refuse the call with a `Result.fail` before anything is sent.

**Signature:**

```typescript
readonly onUnsupported: "fail" | "degrade";
```
