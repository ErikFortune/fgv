[Home](../README.md) > [GridValidationState](./GridValidationState.md) > setCellError

## GridValidationState.setCellError() method

Set validation error for a specific cell.

**Signature:**

```typescript
setCellError(resourceId: string, columnId: string, error: string | null): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resourceId</td><td>string</td><td>Resource ID for the row</td></tr>
<tr><td>columnId</td><td>string</td><td>Column ID for the cell</td></tr>
<tr><td>error</td><td>string | null</td><td>Error message, or null to clear error</td></tr>
</tbody></table>

**Returns:**

void
