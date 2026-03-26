[Home](../README.md) > [Decision](./Decision.md) > createDecision

## Decision.createDecision() method

Creates a new Decisions.Decision | Decision object.

**Signature:**

```typescript
static createDecision(params: IDecisionCreateParams): Result<Decision<JsonValue>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IDecisionCreateParams</td><td>Decisions.IDecisionCreateParams | Parameters used to create the decision.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Decision](Decision.md)&lt;JsonValue&gt;&gt;

`Success` with the new decision if successful, or `Failure` with an error message if not.
