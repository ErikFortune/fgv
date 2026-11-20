[Home](../../README.md) > [AiAssist](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > adaptiveThinkingModelPrefixes

## IAiProviderDescriptor.adaptiveThinkingModelPrefixes property

Concrete Anthropic model ids (exact-or-dash-bounded-prefix-matched) that require the
adaptive thinking wire shape (`thinking: { type: 'adaptive' }` + top-level
`output_config: { effort }`) rather than the legacy manual-budget shape
(`thinking: { type: 'enabled', budget_tokens }`). Non-Anthropic `apiFormat`s ignore this.

**Signature:**

```typescript
readonly adaptiveThinkingModelPrefixes: readonly string[];
```
