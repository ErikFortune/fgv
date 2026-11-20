[Home](../README.md) > [Condition](./Condition.md) > compare

## Condition.compare() method

Compares two conditions for sorting purposes.

**Signature:**

```typescript
static compare(c1: Condition, c2: Condition): number;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>c1</td><td>Condition</td><td>The first Conditions.Condition | condition to compare.</td></tr>
<tr><td>c2</td><td>Condition</td><td>The second Conditions.Condition | condition to compare.</td></tr>
</tbody></table>

**Returns:**

number

A negative number if c1 should come before c2, a positive number
if c2 should come before c1, or zero if they are equivalent.
