[Home](../../README.md) > [QualifierTypes](../README.md) > [LiteralQualifierType](./LiteralQualifierType.md) > validateConfigurationJson

## LiteralQualifierType.validateConfigurationJson() method

QualifierTypes.IQualifierType.validateConfigurationJson

**Signature:**

```typescript
validateConfigurationJson(from: unknown): Result<{ systemType: "literal"; name: string; configuration?: { allowContextList?: boolean; caseSensitive?: boolean; enumeratedValues?: JsonCompatibleArray<string>; hierarchy?: { [key: string]: string } } }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;{ systemType: "literal"; name: string; configuration?: { allowContextList?: boolean; caseSensitive?: boolean; enumeratedValues?: JsonCompatibleArray&lt;string&gt;; hierarchy?: { [key: string]: string } } }&gt;
