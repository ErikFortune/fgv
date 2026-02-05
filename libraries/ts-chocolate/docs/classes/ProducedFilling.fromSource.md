[Home](../README.md) > [ProducedFilling](./ProducedFilling.md) > fromSource

## ProducedFilling.fromSource() method

Factory method for creating a ProducedFilling from a source recipe version.

**Signature:**

```typescript
static fromSource(source: IFillingRecipeVersion, scaleFactor: number): Result<ProducedFilling>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>source</td><td>IFillingRecipeVersion</td><td>Source filling recipe version with runtime wrapper</td></tr>
<tr><td>scaleFactor</td><td>number</td><td>Optional scale factor (default: 1.0)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ProducedFilling](ProducedFilling.md)&gt;

Result containing ProducedFilling or error
