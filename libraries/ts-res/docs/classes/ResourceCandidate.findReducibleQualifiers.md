[Home](../README.md) > [ResourceCandidate](./ResourceCandidate.md) > findReducibleQualifiers

## ResourceCandidate.findReducibleQualifiers() method

Finds the qualifiers that are made irrelevant by the supplied filterForContext.

**Signature:**

```typescript
static findReducibleQualifiers(candidates: readonly ResourceCandidate[], filterForContext: IValidatedContextDecl): ReadonlySet<QualifierName> | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>candidates</td><td>readonly ResourceCandidate[]</td><td>The candidates to find the reducible qualifiers for.</td></tr>
<tr><td>filterForContext</td><td>IValidatedContextDecl</td><td>The filter for context to use.</td></tr>
</tbody></table>

**Returns:**

ReadonlySet&lt;[QualifierName](../type-aliases/QualifierName.md)&gt; | undefined

The qualifiers that are made irrelevant by the filterForContext.
