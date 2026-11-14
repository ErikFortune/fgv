[Home](../README.md) > [Condition](./Condition.md) > getContextMatch

## Condition.getContextMatch() method

Determines if this condition matches the supplied Context.IValidatedContextDecl | validated context.

**Signature:**

```typescript
getContextMatch(context: IValidatedContextDecl, options?: IContextMatchOptions): QualifierMatchScore | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedContextDecl</td><td>The Context.IValidatedContextDecl | context to match against.</td></tr>
<tr><td>options</td><td>IContextMatchOptions</td><td>The Context.IContextMatchOptions | options to use when matching the context.</td></tr>
</tbody></table>

**Returns:**

[QualifierMatchScore](../type-aliases/QualifierMatchScore.md) | undefined

A QualifierMatchScore | match score indicating match quality if the condition is present
in the context to be matched, `undefined` otherwise.
