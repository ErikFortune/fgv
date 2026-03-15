[Home](../../README.md) > [LibraryRuntime](../README.md) > [ConfectionBase](./ConfectionBase.md) > getVariationFromEntity

## ConfectionBase.getVariationFromEntity() method

Wraps an arbitrary variation entity using this confection's context.
Used to create a runtime variation from an in-memory entity that may not yet
be persisted (e.g., a newly created variation from EditedConfectionRecipe).
Does not cache the result.

**Signature:**

```typescript
getVariationFromEntity(entity: AnyConfectionRecipeVariationEntity): Result<TVariation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entity</td><td>AnyConfectionRecipeVariationEntity</td><td>The variation entity to wrap</td></tr>
</tbody></table>

**Returns:**

Result&lt;TVariation&gt;

Result with runtime variation, or Failure if creation fails
