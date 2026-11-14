[Home](../../README.md) > [Experimental](../README.md) > [ExtendedArray](./ExtendedArray.md) > atLeastOne

## ExtendedArray.atLeastOne() method

Returns an array containing all elements of an Experimental.ExtendedArray | ExtendedArray.
Fails with an error message if the array is empty.

**Signature:**

```typescript
atLeastOne(failMessage?: string): Result<T[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>failMessage</td><td>string</td><td>Optional message to be displayed in the event of failure.</td></tr>
</tbody></table>

**Returns:**

Result&lt;T[]&gt;

Returns `Success<T>` with a new (non-extended) `Array`
containing the elements of this array, or `Failure<T>` with an error message
if the array is empty.
