[Home](../README.md) > [ResourceCandidate](./ResourceCandidate.md) > canMatchPartialContext

## ResourceCandidate.canMatchPartialContext() method

Determines if this candidate can match the supplied context (possibly partial).

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

`true` if the candidate can match the context, `false` otherwise.
