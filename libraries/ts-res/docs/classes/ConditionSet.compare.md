[Home](../README.md) > [ConditionSet](./ConditionSet.md) > compare

## ConditionSet.compare() method

Compares two Conditions.ConditionSet | ConditionSets for sorting purposes.

**Signature:**

```typescript
static compare(cs1: ConditionSet, cs2: ConditionSet): number;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cs1</td><td>ConditionSet</td><td>The first Conditions.ConditionSet | ConditionSet to compare.</td></tr>
<tr><td>cs2</td><td>ConditionSet</td><td>The second Conditions.ConditionSet | ConditionSet to compare.</td></tr>
</tbody></table>

**Returns:**

number

A negative number if `cs1` should come before `cs2`, a positive
number if `cs1` should come after `cs2`, or zero if they are equivalent.
