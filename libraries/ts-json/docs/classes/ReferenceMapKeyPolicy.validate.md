[Home](../README.md) > [ReferenceMapKeyPolicy](./ReferenceMapKeyPolicy.md) > validate

## ReferenceMapKeyPolicy.validate() method

Determines if a supplied key and item are valid according to the current policy.

**Signature:**

```typescript
validate(key: string, item?: T, __options?: IReferenceMapKeyPolicyValidateOptions): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key to be tested.</td></tr>
<tr><td>item</td><td>T</td><td>The item to be tested.</td></tr>
<tr><td>__options</td><td>IReferenceMapKeyPolicyValidateOptions</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the key if valid, `Failure` with an error message if invalid.
