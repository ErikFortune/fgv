[Home](../README.md) > [LiteralValueHierarchy](./LiteralValueHierarchy.md) > isAncestor

## LiteralValueHierarchy.isAncestor() method

Determines if a value is an ancestor of a possible ancestor value.

**Signature:**

```typescript
isAncestor(value: T, possibleAncestor: T): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>T</td><td>The value to check.</td></tr>
<tr><td>possibleAncestor</td><td>T</td><td>The possible ancestor value.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the value is an ancestor of the possible ancestor, `false` otherwise.
