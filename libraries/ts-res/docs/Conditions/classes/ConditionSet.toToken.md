[Home](../../README.md) > [Conditions](../README.md) > [ConditionSet](./ConditionSet.md) > toToken

## ConditionSet.toToken() method

Gets a ConditionSetToken | condition set token for this condition set,
if possible.

**Signature:**

```typescript
toToken(terse?: boolean): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>terse</td><td>boolean</td><td>If true, the token will be terse, omitting qualifier names where
possible.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the ConditionSetToken | condition set token if successful,
`Failure` with an error message otherwise.
