[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > validateContext

## ResourceManagerBuilder.validateContext() method

Validates a context declaration against the qualifiers managed by this resource manager.

**Signature:**

```typescript
validateContext(context: IContextDecl): Result<IValidatedContextDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IContextDecl</td><td>The context declaration to validate</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedContextDecl](../type-aliases/IValidatedContextDecl.md)&gt;

Success with the validated context if successful, Failure otherwise
