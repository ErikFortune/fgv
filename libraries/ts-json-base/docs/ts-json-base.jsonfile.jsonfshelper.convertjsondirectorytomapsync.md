<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json-base](./ts-json-base.md) &gt; [JsonFile](./ts-json-base.jsonfile.md) &gt; [JsonFsHelper](./ts-json-base.jsonfile.jsonfshelper.md) &gt; [convertJsonDirectoryToMapSync](./ts-json-base.jsonfile.jsonfshelper.convertjsondirectorytomapsync.md)

## JsonFile.JsonFsHelper.convertJsonDirectoryToMapSync() method

Reads and converts or validates all JSON files from a directory, returning a `Map<string, T>` indexed by file base name (i.e. minus the extension) with an optional name transformation applied if present.

**Signature:**

```typescript
convertJsonDirectoryToMapSync<T, TC = unknown>(srcPath: string, options: IJsonFsDirectoryToMapOptions<T, TC>, context?: unknown): Result<Map<string, T>>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

srcPath


</td><td>

string


</td><td>

The path of the folder to be read.


</td></tr>
<tr><td>

options


</td><td>

[IJsonFsDirectoryToMapOptions](./ts-json-base.jsonfile.ijsonfsdirectorytomapoptions.md)<!-- -->&lt;T, TC&gt;


</td><td>

[Options](./ts-json-base.jsonfile.ijsonfsdirectorytomapoptions.md) to control conversion, filtering and naming.


</td></tr>
<tr><td>

context


</td><td>

unknown


</td><td>

_(Optional)_


</td></tr>
</tbody></table>
**Returns:**

Result&lt;Map&lt;string, T&gt;&gt;

