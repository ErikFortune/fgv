[Home](../../README.md) > [Experimental](../README.md) > [ExtendedArray](./ExtendedArray.md) > single

## ExtendedArray.single() method

Determines if this array contains exactly one element which matches
a supplied predicate.

**Signature:**

```typescript
single(predicate?: (item: T) => boolean): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>predicate</td><td>(item: T) =&gt; boolean</td><td>The predicate function to be applied.</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

Returns `Success<T>` with the single matching
result if exactly one item matches `predicate`.  Returns `Failure<T>`
with an error message if there are no matches or more than one match.
