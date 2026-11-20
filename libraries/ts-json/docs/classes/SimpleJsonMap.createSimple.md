[Home](../README.md) > [SimpleJsonMap](./SimpleJsonMap.md) > createSimple

## SimpleJsonMap.createSimple() method

Creates a new SimpleJsonMap | SimpleJsonMap from the supplied objects

**Signature:**

```typescript
static createSimple(values?: MapOrRecord<JsonValue>, context?: IJsonContext, options?: ISimpleJsonMapOptions): Result<SimpleJsonMap>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>values</td><td>MapOrRecord&lt;JsonValue&gt;</td><td>A string-keyed `Map` or `Record` of the `JsonValue`
to be returned.</td></tr>
<tr><td>context</td><td>IJsonContext</td><td>Optional IJsonContext | IJsonContext used to format returned values.</td></tr>
<tr><td>options</td><td>ISimpleJsonMapOptions</td><td>Optional ISimpleJsonMapOptions | ISimpleJsonMapOptions for initialization.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SimpleJsonMap](SimpleJsonMap.md)&gt;

`Success` with a SimpleJsonMap | SimpleJsonMap or `Failure` with a message if
an error occurs.
