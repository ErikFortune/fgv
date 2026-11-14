[Home](../README.md) > [ResourceType](./ResourceType.md) > getDefaultTemplateCandidate

## ResourceType.getDefaultTemplateCandidate() method

Gets the default template value for this resource type.
Subclasses should override this to provide type-specific default values.

**Signature:**

```typescript
getDefaultTemplateCandidate(json?: JsonValue, conditions?: ConditionSetDecl<string>, __resolver?: IResourceResolver): Result<IChildResourceCandidateDecl<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>json</td><td>JsonValue</td><td></td></tr>
<tr><td>conditions</td><td>ConditionSetDecl&lt;string&gt;</td><td></td></tr>
<tr><td>__resolver</td><td>IResourceResolver</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[IChildResourceCandidateDecl](../interfaces/IChildResourceCandidateDecl.md)&lt;string&gt;&gt;

The default JSON value for a new resource of this type
