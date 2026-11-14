[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getCandidatesForContext

## ResourceManagerBuilder.getCandidatesForContext() method

Gets a read-only array of all Resources.ResourceCandidate | resource candidates that can match the supplied context.

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

A read-only array of Resources.ResourceCandidate | candidates that can match the context.
