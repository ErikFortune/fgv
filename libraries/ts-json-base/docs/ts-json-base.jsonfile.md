<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json-base](./ts-json-base.md) &gt; [JsonFile](./ts-json-base.jsonfile.md)

## JsonFile namespace

## Functions

|  Function | Description |
|  --- | --- |
|  [convertJsonDirectorySync(srcPath, options)](./ts-json-base.jsonfile.convertjsondirectorysync.md) | Reads all JSON files from a directory and apply a supplied converter. |
|  [convertJsonDirectoryToMapSync(srcPath, options)](./ts-json-base.jsonfile.convertjsondirectorytomapsync.md) | Reads and converts all JSON files from a directory, returning a <code>Map&lt;string, T&gt;</code> indexed by file base name (i.e. minus the extension) with an optional name transformation applied if present. |
|  [convertJsonFileSync(srcPath, converter)](./ts-json-base.jsonfile.convertjsonfilesync.md) | Convenience function to read a JSON file and apply a supplied converter. |
|  [readJsonFileSync(srcPath)](./ts-json-base.jsonfile.readjsonfilesync.md) | Convenience function to read type-safe JSON from a file |
|  [writeJsonFileSync(srcPath, value)](./ts-json-base.jsonfile.writejsonfilesync.md) | Convenience function to write type-safe JSON to a file. |

## Interfaces

|  Interface | Description |
|  --- | --- |
|  [IDirectoryConvertOptions](./ts-json-base.jsonfile.idirectoryconvertoptions.md) | Options for directory conversion. TODO: add filtering, allowed and excluded. |
|  [IDirectoryToMapConvertOptions](./ts-json-base.jsonfile.idirectorytomapconvertoptions.md) | Options controlling conversion of a directory. |
|  [IReadDirectoryItem](./ts-json-base.jsonfile.ireaddirectoryitem.md) | Return value for one item in a directory conversion. |

## Type Aliases

|  Type Alias | Description |
|  --- | --- |
|  [ItemNameTransformFunction](./ts-json-base.jsonfile.itemnametransformfunction.md) | Function to transform the name of a some entity, given an original name and the contents of the entity. |
