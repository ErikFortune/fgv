[Home](../README.md) > [PrefixedJsonMap](./PrefixedJsonMap.md) > createPrefixed

## PrefixedJsonMap.createPrefixed() method

Creates a new PrefixedJsonMap | PrefixedJsonMap from the supplied values

**Signature:**

```typescript
static createPrefixed(prefix: string, values?: MapOrRecord<JsonValue>, context?: IJsonContext, editor?: JsonEditor): Result<PrefixedJsonMap>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>prefix</td><td>string</td><td>A string prefix to be enforced for and added to key names as necessary</td></tr>
<tr><td>values</td><td>MapOrRecord&lt;JsonValue&gt;</td><td>A string-keyed Map or Record of the `JsonValue` to be returned</td></tr>
<tr><td>context</td><td>IJsonContext</td><td>Optional IJsonContext | JSON Context used to format returned values</td></tr>
<tr><td>editor</td><td>JsonEditor</td><td>Optional JsonEditor | JsonEditor used to format returned values</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PrefixedJsonMap](PrefixedJsonMap.md)&gt;

`Success` with a PrefixedJsonMap | PrefixedJsonMap or `Failure` with a message
if an error occurs.
