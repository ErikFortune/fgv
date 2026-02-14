[Home](../README.md) > [ConfectionRecipeVariationBase](./ConfectionRecipeVariationBase.md) > getDecorations

## ConfectionRecipeVariationBase.getDecorations() method

Gets resolved decorations for this variation.

**Signature:**

```typescript
getDecorations(): Result<IOptionsWithPreferred<IResolvedConfectionDecorationRef, DecorationId> | undefined>;
```

**Returns:**

Result&lt;[IOptionsWithPreferred](../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionDecorationRef](../interfaces/IResolvedConfectionDecorationRef.md), [DecorationId](../type-aliases/DecorationId.md)&gt; | undefined&gt;

Result with resolved decorations (undefined if none), or Failure if resolution fails
