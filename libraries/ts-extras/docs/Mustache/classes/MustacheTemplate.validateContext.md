[Home](../../README.md) > [Mustache](../README.md) > [MustacheTemplate](./MustacheTemplate.md) > validateContext

## MustacheTemplate.validateContext() method

Validates that a context object has all required variables.

**Signature:**

```typescript
validateContext(context: unknown): Result<IContextValidationResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>unknown</td><td>The context object to validate</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IContextValidationResult](../../interfaces/IContextValidationResult.md)&gt;

Success with validation result containing details about present/missing variables
