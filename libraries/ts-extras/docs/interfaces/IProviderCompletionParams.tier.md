[Home](../README.md) > [IProviderCompletionParams](./IProviderCompletionParams.md) > tier

## IProviderCompletionParams.tier property

Optional quality tier selecting which completion model to use. `undefined`
selects the `base` tier; `'frontier'` cascades to `advanced` then `base`
when a tier is unset for a provider. Orthogonal to `thinking` and `tools`,
which never select a model.

**Signature:**

```typescript
readonly tier: "advanced" | "frontier";
```
