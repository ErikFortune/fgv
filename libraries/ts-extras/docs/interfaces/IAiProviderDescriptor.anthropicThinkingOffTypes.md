[Home](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > anthropicThinkingOffTypes

## IAiProviderDescriptor.anthropicThinkingOffTypes property

Per-model Anthropic thinking-off values for adaptive-thinking models that turn thinking off
with something other than `thinking: { type: 'disabled' }`, the default. Each rule's
`modelPrefix` is matched exact-or-dash-bounded, like
IAiProviderDescriptor.adaptiveThinkingModelPrefixes; the first match wins. Like those
lists, a rule deliberately also matches future variants of its id (`claude-sonnet-5-5-<date>`).

**Signature:**

```typescript
readonly anthropicThinkingOffTypes: readonly IAnthropicThinkingOffRule[];
```
