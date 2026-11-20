[Home](../README.md) > [Resource](./Resource.md) > getCandidatesForContext

## Resource.getCandidatesForContext() method

Gets the candidates for this resource that match the specified Context.IValidatedContextDecl | context.

**Signature:**

```typescript
getCandidatesForContext(context: IValidatedContextDecl, options?: IContextMatchOptions): readonly ResourceCandidate[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedContextDecl</td><td>The Context.IValidatedContextDecl | context to match against.</td></tr>
<tr><td>options</td><td>IContextMatchOptions</td><td>Context.IContextMatchOptions | options for the context match.</td></tr>
</tbody></table>

**Returns:**

readonly [ResourceCandidate](ResourceCandidate.md)[]

The array of Resources.ResourceCandidate | candidates that match the context.
