[Home](../../README.md) > [ResourceTypes](../README.md) > [JsonResourceType](./JsonResourceType.md) > validateDeclaration

## JsonResourceType.validateDeclaration() method

Validates properties of a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration for
a resource instance value.

**Signature:**

```typescript
validateDeclaration(props: IResourceCandidateValidationProperties): Result<JsonObject>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>props</td><td>IResourceCandidateValidationProperties</td><td>The ResourceTypes.IResourceCandidateValidationProperties | properties to validate.</td></tr>
</tbody></table>

**Returns:**

Result&lt;JsonObject&gt;

`Success` with the strongly-typed resource value if the JSON and merge method
are valid, `Failure` with an error message otherwise.
