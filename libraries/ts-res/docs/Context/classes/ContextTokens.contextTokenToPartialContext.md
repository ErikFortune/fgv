[Home](../../README.md) > [Context](../README.md) > [ContextTokens](./ContextTokens.md) > contextTokenToPartialContext

## ContextTokens.contextTokenToPartialContext() method

Converts a ContextToken | context token to a validated partial context.

**Signature:**

```typescript
contextTokenToPartialContext(token: string): Result<IValidatedContextDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td>the context token to convert</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedContextDecl](../../type-aliases/IValidatedContextDecl.md)&gt;

`Success` with the validated partial context if successful, `Failure` with an error message if not.
