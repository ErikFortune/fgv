[Home](../README.md) > [JsonConverter](./JsonConverter.md) > create

## JsonConverter.create() method

Creates a new JsonConverter | JsonConverter.

**Signature:**

```typescript
static create(options?: Partial<IJsonConverterOptions>): Result<JsonConverter>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>Partial&lt;IJsonConverterOptions&gt;</td><td>Optional partial IJsonConverterOptions | options
to configure the converter.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[JsonConverter](JsonConverter.md)&gt;

`Success` with a new JsonConverter | JsonConverter, or `Failure`
with an informative message if an error occurs.
