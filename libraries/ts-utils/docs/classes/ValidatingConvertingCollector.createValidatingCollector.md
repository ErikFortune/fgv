[Home](../README.md) > [ValidatingConvertingCollector](./ValidatingConvertingCollector.md) > createValidatingCollector

## ValidatingConvertingCollector.createValidatingCollector() method

Creates a new Collections.ValidatingConvertingCollector | ValidatingConvertingCollector instance from
the supplied Collections.IValidatingConvertingCollectorConstructorParams | parameters.

**Signature:**

```typescript
static createValidatingCollector(params: IValidatingConvertingCollectorConstructorParams<TITEM, TSRC>): Result<ValidatingConvertingCollector<TITEM, TSRC>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IValidatingConvertingCollectorConstructorParams&lt;TITEM, TSRC&gt;</td><td>Required parameters for constructing the collector.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;[ValidatingConvertingCollector](ValidatingConvertingCollector.md)&lt;TITEM, TSRC&gt;&gt;

Success with the new collector if successful, Failure otherwise.
