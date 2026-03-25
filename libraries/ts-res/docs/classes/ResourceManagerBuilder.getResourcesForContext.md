[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getResourcesForContext

## ResourceManagerBuilder.getResourcesForContext() method

Gets a read-only array of all Resources.ResourceBuilder | resource builders that have at least one candidate
that can match the supplied context.

**Signature:**

```typescript
getResourcesForContext(context: IValidatedContextDecl, options?: IContextMatchOptions): readonly ResourceBuilder[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedContextDecl</td><td>The Context.IValidatedContextDecl | context to match against.</td></tr>
<tr><td>options</td><td>IContextMatchOptions</td><td>Context.IContextMatchOptions | options for the context match.</td></tr>
</tbody></table>

**Returns:**

readonly [ResourceBuilder](ResourceBuilder.md)[]

A read-only array of Resources.ResourceBuilder | resource builders with matching candidates.
