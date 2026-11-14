[Home](../README.md) > [ReferenceMapKeyPolicy](./ReferenceMapKeyPolicy.md) > validateItems

## ReferenceMapKeyPolicy.validateItems() method

Validates an array of entries using the validation rules for this policy.

**Signature:**

```typescript
validateItems(items: [string, T][], options?: IReferenceMapKeyPolicyValidateOptions): Result<[string, T][]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>items</td><td>[string, T][]</td><td>The array of entries to be validated.</td></tr>
<tr><td>options</td><td>IReferenceMapKeyPolicyValidateOptions</td><td>Optional IReferenceMapKeyPolicyValidateOptions | options to control
validation.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[string, T][]&gt;

`Success` with an array of validated entries, or `Failure` with an error message
if validation fails.
