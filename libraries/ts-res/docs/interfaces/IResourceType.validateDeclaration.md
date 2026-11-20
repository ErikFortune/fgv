[Home](../README.md) > [IResourceType](./IResourceType.md) > validateDeclaration

## IResourceType.validateDeclaration() method

Validates properties of a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration for
a resource instance value.

**Signature:**

```typescript
validateDeclaration(props: IResourceCandidateValidationProperties): Result<T | Partial<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>props</td><td>IResourceCandidateValidationProperties</td><td>The ResourceTypes.IResourceCandidateValidationProperties | properties to validate.</td></tr>
</tbody></table>

**Returns:**

Result&lt;T | Partial&lt;T&gt;&gt;

`Success` with the strongly-typed resource value if the JSON and merge method
are valid, `Failure` with an error message otherwise.
