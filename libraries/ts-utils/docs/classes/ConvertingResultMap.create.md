[Home](../README.md) > [ConvertingResultMap](./ConvertingResultMap.md) > create

## ConvertingResultMap.create() method

Creates a new Collections.ConvertingResultMap | ConvertingResultMap.

**Signature:**

```typescript
static create(params: IConvertingResultMapConstructorParams<TK, TSRC, TTARGET, TSRCMAP>): Result<ConvertingResultMap<TK, TSRC, TTARGET, TSRCMAP>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IConvertingResultMapConstructorParams&lt;TK, TSRC, TTARGET, TSRCMAP&gt;</td><td>Parameters for constructing the map.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;[ConvertingResultMap](ConvertingResultMap.md)&lt;TK, TSRC, TTARGET, TSRCMAP&gt;&gt;

`Success` with the new map, or `Failure` with error details if an error occurred.
