[Home](../../README.md) > [AiAssist](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > geminiThinkingLevels

## IAiProviderDescriptor.geminiThinkingLevels property

Gemini models sent `thinkingLevel` rather than `thinkingBudget`, each with the levels it
accepts, lowest first; matched exact-or-dash-bounded, longest prefix wins (see
AiAssist.resolveGeminiThinkingLevels). On a matching model a generic `'none'` is sent as
`'minimal'` where listed (otherwise handled like a thinking-required model, or refused), other
efforts map 1:1 or are refused when unlisted. Unmatched models keep the budget wire.

**Signature:**

```typescript
readonly geminiThinkingLevels: readonly IGeminiThinkingLevelRule[];
```
