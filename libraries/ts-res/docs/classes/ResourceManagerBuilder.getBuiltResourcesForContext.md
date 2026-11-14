[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getBuiltResourcesForContext

## ResourceManagerBuilder.getBuiltResourcesForContext() method

Gets a read-only array of all Resources.Resource | built resources that have at least one candidate
that can match the supplied context.

**Signature:**

```typescript
getBuiltResourcesForContext(context: IValidatedContextDecl, options?: IContextMatchOptions): Result<readonly Resource[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedContextDecl</td><td>The Context.IValidatedContextDecl | context to match against.</td></tr>
<tr><td>options</td><td>IContextMatchOptions</td><td>Context.IContextMatchOptions | options for the context match.</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [Resource](Resource.md)[]&gt;

`Success` with an array of Resources.Resource | resources if successful, or `Failure` with an error message if not.
