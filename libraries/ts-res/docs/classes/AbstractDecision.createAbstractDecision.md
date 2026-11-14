[Home](../README.md) > [AbstractDecision](./AbstractDecision.md) > createAbstractDecision

## AbstractDecision.createAbstractDecision() method

Creates a new Decisions.AbstractDecision | AbstractDecision object.

**Signature:**

```typescript
static createAbstractDecision(params: IAbstractDecisionCreateParams): Result<AbstractDecision>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IAbstractDecisionCreateParams</td><td>Decisions.IAbstractDecisionCreateParams | Parameters
used to create the decision.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AbstractDecision](AbstractDecision.md)&gt;

`Success` with the new decision if successful, or `Failure` with an
error message if not.
