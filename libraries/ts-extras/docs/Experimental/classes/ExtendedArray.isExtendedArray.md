[Home](../../README.md) > [Experimental](../README.md) > [ExtendedArray](./ExtendedArray.md) > isExtendedArray

## ExtendedArray.isExtendedArray() method

Type guard to determine if some arbitrary array is an
Experimental.ExtendedArray

**Signature:**

```typescript
static isExtendedArray(a?: T[]): a is ExtendedArray<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>a</td><td>T[]</td><td>The `Array` to be tested.</td></tr>
</tbody></table>

**Returns:**

a is [ExtendedArray](../../classes/ExtendedArray.md)&lt;T&gt;

Returns `true` if `a` is an Experimental.ExtendedArray | ExtendedArray,
`false` otherwise.
