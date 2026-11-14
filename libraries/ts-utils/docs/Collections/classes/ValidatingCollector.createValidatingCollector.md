[Home](../../README.md) > [Collections](../README.md) > [ValidatingCollector](./ValidatingCollector.md) > createValidatingCollector

## ValidatingCollector.createValidatingCollector() method

Creates a new Collections.ValidatingCollector | ValidatingCollector instance from
the supplied Collections.IValidatingCollectorConstructorParams | parameters.

**Signature:**

```typescript
static createValidatingCollector(params: IValidatingCollectorConstructorParams<TITEM>): Result<ValidatingCollector<TITEM>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IValidatingCollectorConstructorParams&lt;TITEM&gt;</td><td>Required parameters for constructing the collector.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;[ValidatingCollector](../../classes/ValidatingCollector.md)&lt;TITEM&gt;&gt;

Success with the new collector if successful, Failure otherwise.
