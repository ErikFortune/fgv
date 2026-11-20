[Home](../../README.md) > [Collections](../README.md) > [ReadOnlyConvertingResultMap](./ReadOnlyConvertingResultMap.md) > create

## ReadOnlyConvertingResultMap.create() method

Creates a new Collections.ReadOnlyConvertingResultMap | ReadOnlyConvertingResultMap.

**Signature:**

```typescript
static create(params: IReadOnlyConvertingResultMapConstructorParams<TK, TSRC, TTARGET>): Result<ReadOnlyConvertingResultMap<TK, TSRC, TTARGET>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IReadOnlyConvertingResultMapConstructorParams&lt;TK, TSRC, TTARGET&gt;</td><td>Parameters for constructing the map.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;[ReadOnlyConvertingResultMap](../../classes/ReadOnlyConvertingResultMap.md)&lt;TK, TSRC, TTARGET&gt;&gt;

`Success` with the new map, or `Failure` with error details if an error occurred.
