[Home](../README.md) > [ConvertingCollector](./ConvertingCollector.md) > createConvertingCollector

## ConvertingCollector.createConvertingCollector() method

Creates a new Collections.ConvertingCollector | ConvertingCollector.

**Signature:**

```typescript
static createConvertingCollector(params: IConvertingCollectorConstructorParams<TITEM, TSRC>): Result<ConvertingCollector<TITEM, TSRC>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IConvertingCollectorConstructorParams&lt;TITEM, TSRC&gt;</td><td>Required parameters for constructing the collector.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;[ConvertingCollector](ConvertingCollector.md)&lt;TITEM, TSRC&gt;&gt;

Returns Success | Success with the new collector if it is created, or Failure | Failure
with an error if the collector cannot be created.
