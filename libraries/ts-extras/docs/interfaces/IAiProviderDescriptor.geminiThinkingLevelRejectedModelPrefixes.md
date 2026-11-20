[Home](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > geminiThinkingLevelRejectedModelPrefixes

## IAiProviderDescriptor.geminiThinkingLevelRejectedModelPrefixes property

Gemini models (exact-or-dash-bounded) that do not support `thinkingLevel` at all and take only
`thinkingBudget`. An explicit `thinkingLevel` aimed at one — in a `google` block, or in a
caller-built `resolvedThinking` on `executeClientToolTurn` — is refused before the wire (see
AiAssist.rejectsGeminiThinkingLevel). Models on neither this list nor
AiAssist.IAiProviderDescriptor.geminiThinkingLevels are sent an explicit level verbatim.

**Signature:**

```typescript
readonly geminiThinkingLevelRejectedModelPrefixes: readonly string[];
```
