[Home](../../README.md) > [Decisions](../README.md) > [ConcreteDecision](./ConcreteDecision.md) > create

## ConcreteDecision.create() method

Creates a new Decisions.ConcreteDecision | ConcreteDecision object.

**Signature:**

```typescript
static create(params: IConcreteDecisionCreateParams<TVALUE>): Result<ConcreteDecision<TVALUE>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IConcreteDecisionCreateParams&lt;TVALUE&gt;</td><td>Decisions.IConcreteDecisionCreateParams | Parameters
used to create the decision.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConcreteDecision](../../classes/ConcreteDecision.md)&lt;TVALUE&gt;&gt;

`Success` with the new decision if successful, or `Failure` with an
error message if not.
