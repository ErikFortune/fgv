[Home](../README.md) > [IReadOnlyQualifierCollector](./IReadOnlyQualifierCollector.md) > getByNameOrToken

## IReadOnlyQualifierCollector.getByNameOrToken() method

Gets a Qualifiers.Qualifier | qualifier by name or token.

**Signature:**

```typescript
getByNameOrToken(nameOrToken: string): Result<Qualifier>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>nameOrToken</td><td>string</td><td>The name or token of the qualifier to retrieve.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Qualifier](../classes/Qualifier.md)&gt;

`Success` with the qualifier if found, or `Failure` if not.
