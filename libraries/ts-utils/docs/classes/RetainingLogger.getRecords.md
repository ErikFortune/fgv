[Home](../README.md) > [RetainingLogger](./RetainingLogger.md) > getRecords

## RetainingLogger.getRecords() method

Returns retained records, oldest-first, optionally filtered.

**Signature:**

```typescript
getRecords(options?: IGetRecordsOptions): readonly ILogRecord[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IGetRecordsOptions</td><td>Logging.IGetRecordsOptions | Filtering and paging options.</td></tr>
</tbody></table>

**Returns:**

readonly [ILogRecord](../interfaces/ILogRecord.md)[]

The matching records, oldest-first.
