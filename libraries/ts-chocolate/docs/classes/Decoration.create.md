[Home](../README.md) > [Decoration](./Decoration.md) > create

## Decoration.create() method

Factory method for creating a Decoration.

**Signature:**

```typescript
static create(context: IDecorationContext, id: DecorationId, entity: IDecorationEntity): Result<Decoration>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IDecorationContext</td><td>The runtime context for ingredient/procedure resolution</td></tr>
<tr><td>id</td><td>DecorationId</td><td>The composite decoration ID</td></tr>
<tr><td>entity</td><td>IDecorationEntity</td><td>The decoration data entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Decoration](Decoration.md)&gt;

Success with Decoration
