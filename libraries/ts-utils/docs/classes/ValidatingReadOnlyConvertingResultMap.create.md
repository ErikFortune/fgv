[Home](../README.md) > [ValidatingReadOnlyConvertingResultMap](./ValidatingReadOnlyConvertingResultMap.md) > create

## ValidatingReadOnlyConvertingResultMap.create() method

Creates a new Collections.ValidatingReadOnlyConvertingResultMap | ValidatingReadOnlyConvertingResultMap.

**Signature:**

```typescript
static create(params: IValidatingReadOnlyConvertingResultMapConstructorParams<TK, TSRC, TTARGET>): Result<ValidatingReadOnlyConvertingResultMap<TK, TSRC, TTARGET>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IValidatingReadOnlyConvertingResultMapConstructorParams&lt;TK, TSRC, TTARGET&gt;</td><td>Parameters for constructing the map.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;[ValidatingReadOnlyConvertingResultMap](ValidatingReadOnlyConvertingResultMap.md)&lt;TK, TSRC, TTARGET&gt;&gt;

`Success` with the new map, or `Failure` with error details if an error occurred.
