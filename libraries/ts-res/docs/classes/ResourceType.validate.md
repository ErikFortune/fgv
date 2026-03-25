[Home](../README.md) > [ResourceType](./ResourceType.md) > validate

## ResourceType.validate() method

Validates a JSON value for use as a partial resource instance value.

**Signature:**

```typescript
validate(json: JsonValue, completeness: CandidateCompleteness): Result<Partial<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>json</td><td>JsonValue</td><td>The JSON value to validate.</td></tr>
<tr><td>completeness</td><td>CandidateCompleteness</td><td>Describes CandidateCompleteness | how complete the candidate value is.</td></tr>
</tbody></table>

**Returns:**

Result&lt;Partial&lt;T&gt;&gt;

`Success` with the strongly-typed partial resource value if the JSON is valid,
`Failure` with an error message otherwise.
