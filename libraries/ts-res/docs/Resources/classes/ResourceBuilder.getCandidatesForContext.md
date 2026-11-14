[Home](../../README.md) > [Resources](../README.md) > [ResourceBuilder](./ResourceBuilder.md) > getCandidatesForContext

## ResourceBuilder.getCandidatesForContext() method

Gets the Resources.ResourceCandidate | candidates that match a given Context.IValidatedContextDecl | context.

**Signature:**

```typescript
getCandidatesForContext(context: IValidatedContextDecl, options?: IContextMatchOptions): readonly ResourceCandidate[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedContextDecl</td><td>The Context.IValidatedContextDecl | context to get candidates for.</td></tr>
<tr><td>options</td><td>IContextMatchOptions</td><td>Optional Context.IContextMatchOptions | context match options to use when matching candidates.</td></tr>
</tbody></table>

**Returns:**

readonly [ResourceCandidate](../../classes/ResourceCandidate.md)[]

An array of Resources.ResourceCandidate | candidates that match the given context.
