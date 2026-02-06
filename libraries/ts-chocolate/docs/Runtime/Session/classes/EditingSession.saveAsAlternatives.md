[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > [EditingSession](./EditingSession.md) > saveAsAlternatives

## EditingSession.saveAsAlternatives() method

Saves by adding ingredients as alternatives to existing variation.
Requires that the collection is mutable and ingredients changed.

**Signature:**

```typescript
saveAsAlternatives(options: ISaveAlternativesOptions): Result<ISaveResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>ISaveAlternativesOptions</td><td>Save options including variation spec</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ISaveResult](../../../interfaces/ISaveResult.md)&gt;

Result with save result containing journal entry
