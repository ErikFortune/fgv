[Home](../README.md) > [IQualifierType](./IQualifierType.md) > validateConfigurationJson

## IQualifierType.validateConfigurationJson() method

Validates configuration JSON data for this qualifier type.

**Signature:**

```typescript
validateConfigurationJson(from: unknown): Result<{ name: string; systemType: string; configuration?: JsonCompatibleType<TCFGJSON | undefined> }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The unknown data to validate as configuration JSON.</td></tr>
</tbody></table>

**Returns:**

Result&lt;{ name: string; systemType: string; configuration?: JsonCompatibleType&lt;TCFGJSON | undefined&gt; }&gt;

`Success` with validated JSON configuration if valid, `Failure` with an error message otherwise.
