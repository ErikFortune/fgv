[Home](../README.md) > [Procedure](./Procedure.md) > create

## Procedure.create() method

Factory method for creating a Procedure.

**Signature:**

```typescript
static create(context: IProcedureContext, id: ProcedureId, procedure: IProcedureEntity): Result<Procedure>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IProcedureContext</td><td>The runtime context for task resolution</td></tr>
<tr><td>id</td><td>ProcedureId</td><td>The composite procedure ID</td></tr>
<tr><td>procedure</td><td>IProcedureEntity</td><td>The procedure data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Procedure](Procedure.md)&gt;

Success with Procedure
