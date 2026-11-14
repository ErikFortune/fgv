[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getBuiltCandidatesForContext

## ResourceManagerBuilder.getBuiltCandidatesForContext() method

Gets a read-only array of all Resources.ResourceCandidate | built resource candidates that can match the supplied context.

**Signature:**

```typescript
getBuiltCandidatesForContext(context: IValidatedContextDecl, options?: IContextMatchOptions): Result<readonly ResourceCandidate[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedContextDecl</td><td>The Context.IValidatedContextDecl | context to match against.</td></tr>
<tr><td>options</td><td>IContextMatchOptions</td><td>Context.IContextMatchOptions | options for the context match.</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [ResourceCandidate](ResourceCandidate.md)[]&gt;

`Success` with an array of Resources.ResourceCandidate | candidates if successful, or `Failure` with an error message if not.
