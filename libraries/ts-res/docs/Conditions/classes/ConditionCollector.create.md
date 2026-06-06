[Home](../../README.md) > [Conditions](../README.md) > [ConditionCollector](./ConditionCollector.md) > create

## ConditionCollector.create() method

Creates a new Conditions.ConditionCollector | ConditionCollector object.

**Signature:**

```typescript
static create(params: IConditionCollectorCreateParams): Result<ConditionCollector>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IConditionCollectorCreateParams</td><td>Required Conditions.IConditionCollectorCreateParams | parameters for
creating the collector.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionCollector](../../classes/ConditionCollector.md)&gt;

`Success` with the new collector if successful, or `Failure` with
an error message if not.
