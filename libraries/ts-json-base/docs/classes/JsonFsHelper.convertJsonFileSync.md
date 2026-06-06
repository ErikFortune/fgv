[Home](../README.md) > [JsonFsHelper](./JsonFsHelper.md) > convertJsonFileSync

## JsonFsHelper.convertJsonFileSync() method

Read a JSON file and apply a supplied converter or validator.

**Signature:**

```typescript
convertJsonFileSync(srcPath: string, cv: Converter<T, TC> | Validator<T, TC>, context?: TC): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>srcPath</td><td>string</td><td>Path of the file to read.</td></tr>
<tr><td>cv</td><td>Converter&lt;T, TC&gt; | Validator&lt;T, TC&gt;</td><td>Converter or validator used to process the file.</td></tr>
<tr><td>context</td><td>TC</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

`Success` with a result of type `<T>`, or `Failure`
with a message if an error occurs.
