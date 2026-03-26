[Home](../README.md) > [LiteralValueHierarchy](./LiteralValueHierarchy.md) > getAncestors

## LiteralValueHierarchy.getAncestors() method

Gets all ancestors of a value in the hierarchy.

**Signature:**

```typescript
getAncestors(value: T): Result<T[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>T</td><td>The value to get ancestors for.</td></tr>
</tbody></table>

**Returns:**

Result&lt;T[]&gt;

`Success` with an array of ancestor values, ordered from immediate parent
to root, or `Failure` if the value is not in the hierarchy.
