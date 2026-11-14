[Home](../README.md) > [JsonContextHelper](./JsonContextHelper.md) > create

## JsonContextHelper.create() method

Creates a new IJsonContext | context.

**Signature:**

```typescript
static create(context?: IJsonContext): Result<JsonContextHelper>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IJsonContext</td><td>The base IJsonContext | IJsonContext on
which to operate.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[JsonContextHelper](JsonContextHelper.md)&gt;

`Success` with the new IJsonContext | IJsonContext,
or `Failure` with more information if an error occurs.
