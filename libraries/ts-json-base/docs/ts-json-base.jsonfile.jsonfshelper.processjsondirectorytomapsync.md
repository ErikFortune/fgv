<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json-base](./ts-json-base.md) &gt; [JsonFile](./ts-json-base.jsonfile.md) &gt; [JsonFsHelper](./ts-json-base.jsonfile.jsonfshelper.md) &gt; [processJsonDirectoryToMapSync](./ts-json-base.jsonfile.jsonfshelper.processjsondirectorytomapsync.md)

## JsonFile.JsonFsHelper.processJsonDirectoryToMapSync() method

Reads and converts or validates all JSON files from a directory, returning a `Map<string, T>` indexed by file base name (i.e. minus the extension) with an optional name transformation applied if present.

**Signature:**

```typescript
processJsonDirectoryToMapSync<T, TC = unknown>(srcPath: string, options: JsonFsDirectoryToMapOptions<T, TC>): Result<Map<string, T>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  srcPath | string | The path of the folder to be read. |
|  options | [JsonFsDirectoryToMapOptions](./ts-json-base.jsonfile.jsonfsdirectorytomapoptions.md)<!-- -->&lt;T, TC&gt; | [Options](./ts-json-base.jsonfile.jsonfsdirectorytomapoptions.md) to control conversion, filtering and naming. |

**Returns:**

Result&lt;Map&lt;string, T&gt;&gt;

