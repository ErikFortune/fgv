[Home](../../README.md) > [QualifierTypes](../README.md) > [IQualifierType](./IQualifierType.md) > isValidContextValue

## IQualifierType.isValidContextValue() method

Validates a context value for this qualifier type.

**Signature:**

```typescript
isValidContextValue(value: string): value is QualifierContextValue;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>string</td><td>The string value to validate.</td></tr>
</tbody></table>

**Returns:**

value is [QualifierContextValue](../../type-aliases/QualifierContextValue.md)

`Success` with the QualifierContextValue | validated value
if the value is valid for use in a runtime context, `Failure` with error
details otherwise.
