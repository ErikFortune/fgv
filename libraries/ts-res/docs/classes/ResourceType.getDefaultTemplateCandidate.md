[Home](../README.md) > [ResourceType](./ResourceType.md) > getDefaultTemplateCandidate

## ResourceType.getDefaultTemplateCandidate() method

Gets the default template value for this resource type.
Subclasses should override this to provide type-specific default values.

**Signature:**

```typescript
getDefaultTemplateCandidate(json?: JsonValue, conditions?: ConditionSetDecl, __resolver?: IResourceResolver): Result<IChildResourceCandidateDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>json</td><td>JsonValue</td><td></td></tr>
<tr><td>conditions</td><td>ConditionSetDecl</td><td></td></tr>
<tr><td>__resolver</td><td>IResourceResolver</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[IChildResourceCandidateDecl](../interfaces/IChildResourceCandidateDecl.md)&gt;

The default JSON value for a new resource of this type
