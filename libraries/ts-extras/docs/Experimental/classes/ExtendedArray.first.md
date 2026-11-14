[Home](../../README.md) > [Experimental](../README.md) > [ExtendedArray](./ExtendedArray.md) > first

## ExtendedArray.first() method

Returns the first element of an Experimental.ExtendedArray | ExtendedArray. Fails with an
error message if the array is empty.

**Signature:**

```typescript
first(failMessage?: string): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>failMessage</td><td>string</td><td>Optional message to be displayed in the event of failure.</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

Returns `Success<T>` with the value of the first element
in the array, or `Failure<T>` with an error message if the array is empty.
