[Home](../../README.md) > [Collections](../README.md) > [ValidatingConvertingResultMap](./ValidatingConvertingResultMap.md) > create

## ValidatingConvertingResultMap.create() method

Creates a new Collections.ValidatingConvertingResultMap | ValidatingConvertingResultMap.

**Signature:**

```typescript
static create(params: IValidatingConvertingResultMapConstructorParams<TK, TSRC, TTARGET, TSRCMAP>): Result<ValidatingConvertingResultMap<TK, TSRC, TTARGET, TSRCMAP>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IValidatingConvertingResultMapConstructorParams&lt;TK, TSRC, TTARGET, TSRCMAP&gt;</td><td>Parameters for constructing the map.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;[ValidatingConvertingResultMap](../../classes/ValidatingConvertingResultMap.md)&lt;TK, TSRC, TTARGET, TSRCMAP&gt;&gt;

`Success` with the new map, or `Failure` with error details if an error occurred.
