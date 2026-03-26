[Home](../README.md) > [ReferenceMapKeyPolicy](./ReferenceMapKeyPolicy.md) > validateMap

## ReferenceMapKeyPolicy.validateMap() method

Validates a `Map\<string, T\>` using the validation rules for this policy.

**Signature:**

```typescript
validateMap(map: Map<string, T>, options?: IReferenceMapKeyPolicyValidateOptions): Result<Map<string, T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>map</td><td>Map&lt;string, T&gt;</td><td></td></tr>
<tr><td>options</td><td>IReferenceMapKeyPolicyValidateOptions</td><td>Optional IReferenceMapKeyPolicyValidateOptions | options to control
validation.</td></tr>
</tbody></table>

**Returns:**

Result&lt;Map&lt;string, T&gt;&gt;

`Success` with a new `Map\<string, T\>`, or `Failure` with an error message
if validation fails.
