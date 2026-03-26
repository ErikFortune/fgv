[Home](../../README.md) > [Hints](../README.md) > [HintRegistry](./HintRegistry.md) > create

## HintRegistry.create() method

Creates a new HintRegistry with the specified providers pre-registered.

**Signature:**

```typescript
static create(providers?: readonly IHintProvider[]): Result<HintRegistry>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>providers</td><td>readonly IHintProvider[]</td><td>The providers to register</td></tr>
</tbody></table>

**Returns:**

Result&lt;[HintRegistry](../../classes/HintRegistry.md)&gt;

Result containing the new registry or failure if registration fails
