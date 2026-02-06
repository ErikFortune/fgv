[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > [EditingSession](./EditingSession.md) > saveAsNewVariation

## EditingSession.saveAsNewVariation() method

Saves as a new version of the original recipe.
Requires that the collection is mutable.

**Signature:**

```typescript
saveAsNewVariation(options: ISaveVariationOptions): Result<ISaveResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>ISaveVariationOptions</td><td>Save options including version spec and base weight</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ISaveResult](../../../interfaces/ISaveResult.md)&gt;

Result with save result containing journal entry and version spec
