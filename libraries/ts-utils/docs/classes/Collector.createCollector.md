[Home](../README.md) > [Collector](./Collector.md) > createCollector

## Collector.createCollector() method

Creates a new Collections.Collector | Collector instance.

**Signature:**

```typescript
static createCollector(params?: ICollectorConstructorParams<TITEM>): Result<Collector<TITEM>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ICollectorConstructorParams&lt;TITEM&gt;</td><td>Optional Collections.ICollectorConstructorParams | initialization parameters used
to create the collector.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;[Collector](Collector.md)&lt;TITEM&gt;&gt;

Returns Success | Success with the new collector if it was created successfully,
or Failure | Failure with an error if the collector could not be created.
