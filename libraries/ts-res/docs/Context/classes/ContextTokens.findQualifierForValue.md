[Home](../../README.md) > [Context](../README.md) > [ContextTokens](./ContextTokens.md) > findQualifierForValue

## ContextTokens.findQualifierForValue() method

Given a value, finds a single token-optional qualifier that matches the value.
Fails if no qualifiers match, or if more than one qualifier matches.

**Signature:**

```typescript
findQualifierForValue(value: string): Result<Qualifier>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>string</td><td>the value to match.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Qualifier](../../classes/Qualifier.md)&gt;

`Success` with the matching qualifier if successful, `Failure` with an error message if not.
