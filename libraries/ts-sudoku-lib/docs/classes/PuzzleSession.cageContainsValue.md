[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > cageContainsValue

## PuzzleSession.cageContainsValue() method

Determines if some ICage | cage contains a specific value.

**Signature:**

```typescript
cageContainsValue(spec: string | ICage, value: number): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | ICage</td><td>A `string` (CageId | CageId) or ICage | ICage
indicating the cage to be tested.</td></tr>
<tr><td>value</td><td>number</td><td>The value to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the cage exists and contains the specified value,
`false` otherwise.
