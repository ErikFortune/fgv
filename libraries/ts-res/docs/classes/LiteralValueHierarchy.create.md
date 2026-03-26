[Home](../README.md) > [LiteralValueHierarchy](./LiteralValueHierarchy.md) > create

## LiteralValueHierarchy.create() method

Creates a new QualifierTypes.LiteralValueHierarchy | LiteralValueHierarchy instance.

**Signature:**

```typescript
static create(params: ILiteralValueHierarchyCreateParams<T>): Result<LiteralValueHierarchy<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ILiteralValueHierarchyCreateParams&lt;T&gt;</td><td>The QualifierTypes.ILiteralValueHierarchyCreateParams | parameters
used to create the hierarchy.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LiteralValueHierarchy](LiteralValueHierarchy.md)&lt;T&gt;&gt;

`Success` with the new hierarchy or `Failure` with an error message.
