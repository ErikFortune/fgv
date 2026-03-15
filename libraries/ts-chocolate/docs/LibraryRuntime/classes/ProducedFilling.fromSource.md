[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedFilling](./ProducedFilling.md) > fromSource

## ProducedFilling.fromSource() method

Factory method for creating a ProducedFilling from a source recipe variation.

**Signature:**

```typescript
static fromSource(source: IFillingRecipeVariation, scaleFactor: number): Result<ProducedFilling>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>source</td><td>IFillingRecipeVariation</td><td>Source filling recipe variation with runtime wrapper</td></tr>
<tr><td>scaleFactor</td><td>number</td><td>Optional scale factor (default: 1.0)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ProducedFilling](../../classes/ProducedFilling.md)&gt;

Result containing ProducedFilling or error
