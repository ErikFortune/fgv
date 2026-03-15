[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedFilling](./ProducedFilling.md) > toSourceVariation

## ProducedFilling.toSourceVariation() method

Converts a produced filling entity back to a source recipe variation entity.
Used when saving a new variation from an editing session.

**Signature:**

```typescript
static toSourceVariation(snapshot: IProducedFillingEntity, newVariationSpec: string, createdDate?: string): Result<IFillingRecipeVariationEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>snapshot</td><td>IProducedFillingEntity</td><td>The produced filling snapshot to convert</td></tr>
<tr><td>newVariationSpec</td><td>string</td><td>The variation spec for the new variation</td></tr>
<tr><td>createdDate</td><td>string</td><td>Optional creation date (defaults to current ISO date)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingRecipeVariationEntity](../../interfaces/IFillingRecipeVariationEntity.md)&gt;

Result with source variation entity
