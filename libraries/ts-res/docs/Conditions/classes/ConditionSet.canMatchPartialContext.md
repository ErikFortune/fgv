[Home](../../README.md) > [Conditions](../README.md) > [ConditionSet](./ConditionSet.md) > canMatchPartialContext

## ConditionSet.canMatchPartialContext() method

Determines if this condition set can match a supplied context, even if the context is partial.
Returns true if all conditions in the set can match the context (using canMatchPartialContext).
Returns false otherwise.

**Signature:**

```typescript
canMatchPartialContext(context: IValidatedContextDecl, options?: IContextMatchOptions): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedContextDecl</td><td>The context to match.</td></tr>
<tr><td>options</td><td>IContextMatchOptions</td><td>Options to use when matching.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if all conditions can match the context, `false` otherwise.
