[Home](../../README.md) > [Context](../README.md) > [ContextTokens](./ContextTokens.md) > partialContextToContextToken

## ContextTokens.partialContextToContextToken() method

Converts a validated partial context to a ContextToken | context token.

**Signature:**

```typescript
partialContextToContextToken(context: IValidatedContextDecl): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedContextDecl</td><td>the validated partial context to convert</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the context token if successful, `Failure` with an error message if not.
