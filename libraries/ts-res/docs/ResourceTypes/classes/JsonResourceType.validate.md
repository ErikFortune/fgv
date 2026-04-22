[Home](../../README.md) > [ResourceTypes](../README.md) > [JsonResourceType](./JsonResourceType.md) > validate

## JsonResourceType.validate() method

Validates a JSON value for use as a resource instance value.

**Signature:**

```typescript
validate(json: JsonObject, completeness: CandidateCompleteness): Result<JsonObject>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>json</td><td>JsonObject</td><td>The JSON value to validate.</td></tr>
<tr><td>completeness</td><td>CandidateCompleteness</td><td>Describes CandidateCompleteness | how complete the candidate value is.</td></tr>
</tbody></table>

**Returns:**

Result&lt;JsonObject&gt;

`Success` with the strongly-typed resource value if the JSON is valid,
`Failure` with an error message otherwise.
