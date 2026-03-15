[Home](../README.md) > [ValidatingEditorContext](./ValidatingEditorContext.md) > createValidating

## ValidatingEditorContext.createValidating() method

Create a new validating editor context.

**Signature:**

```typescript
static createValidating(params: IValidatingEditorContextParams<T, TBaseId, TId>): Result<ValidatingEditorContext<T, TBaseId, TId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IValidatingEditorContextParams&lt;T, TBaseId, TId&gt;</td><td>Creation parameters including converters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ValidatingEditorContext](ValidatingEditorContext.md)&lt;T, TBaseId, TId&gt;&gt;

Result containing the validating editor context or failure
