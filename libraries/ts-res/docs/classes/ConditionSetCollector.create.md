[Home](../README.md) > [ConditionSetCollector](./ConditionSetCollector.md) > create

## ConditionSetCollector.create() method

Creates a new Conditions.ConditionSetCollector | ConditionSetCollector.

**Signature:**

```typescript
static create(params: IConditionSetCollectorCreateParams): Result<ConditionSetCollector>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IConditionSetCollectorCreateParams</td><td>Conditions.IConditionSetCollectorCreateParams | Parameters used to create
the collector.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionSetCollector](ConditionSetCollector.md)&gt;

`Success` with the new collector if successful, or `Failure` with an error message
if not.
