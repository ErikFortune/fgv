[Home](../../README.md) > [QualifierTypes](../README.md) > [LiteralValueHierarchy](./LiteralValueHierarchy.md) > getDescendants

## LiteralValueHierarchy.getDescendants() method

Gets all descendants of a value in the hierarchy.

**Signature:**

```typescript
getDescendants(value: T): Result<T[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>T</td><td>The value to get descendants for.</td></tr>
</tbody></table>

**Returns:**

Result&lt;T[]&gt;

`Success` with an array of descendant values, or `Failure` if the value
is not in the hierarchy.
