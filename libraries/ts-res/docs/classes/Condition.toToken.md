[Home](../README.md) > [Condition](./Condition.md) > toToken

## Condition.toToken() method

Gets a ConditionToken | condition token for this condition, if possible.
It is not possible to get a token for a condition with an operator other than `matches`,
with other-than-default priority, or with a name or value that contains other than alphanumeric
characters, underscore or non-leading hyphen.

**Signature:**

```typescript
toToken(terse?: boolean): Result<ConditionToken>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>terse</td><td>boolean</td><td>if `true` and if the qualifier token is optional, the token will be omitted
from the generated ConditionToken | condition token.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionToken](../type-aliases/ConditionToken.md)&gt;


