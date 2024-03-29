<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json-base](./ts-json-base.md) &gt; [JsonFile](./ts-json-base.jsonfile.md)

## JsonFile namespace

## Classes

|  Class | Description |
|  --- | --- |
|  [JsonFsHelper](./ts-json-base.jsonfile.jsonfshelper.md) | Helper class to simplify common filesystem operations involving JSON (or JSON-like) files. |

## Functions

|  Function | Description |
|  --- | --- |
|  [convertJsonDirectorySync(srcPath, options)](./ts-json-base.jsonfile.convertjsondirectorysync.md) | Reads all JSON files from a directory and apply a supplied converter. |
|  [convertJsonDirectoryToMapSync(srcPath, options)](./ts-json-base.jsonfile.convertjsondirectorytomapsync.md) | Reads and converts all JSON files from a directory, returning a <code>Map&lt;string, T&gt;</code> indexed by file base name (i.e. minus the extension) with an optional name transformation applied if present. |
|  [convertJsonFileSync(srcPath, converter)](./ts-json-base.jsonfile.convertjsonfilesync.md) | Read a JSON file and apply a supplied converter. |
|  [readJsonFileSync(srcPath)](./ts-json-base.jsonfile.readjsonfilesync.md) | Read type-safe JSON from a file. |
|  [writeJsonFileSync(srcPath, value)](./ts-json-base.jsonfile.writejsonfilesync.md) | Write type-safe JSON to a file. |

## Interfaces

|  Interface | Description |
|  --- | --- |
|  [IDirectoryConvertOptions](./ts-json-base.jsonfile.idirectoryconvertoptions.md) | Options for directory conversion. TODO: add filtering, allowed and excluded. |
|  [IDirectoryToMapConvertOptions](./ts-json-base.jsonfile.idirectorytomapconvertoptions.md) | Options controlling conversion of a directory to a <code>Map</code>. |
|  [IDirectoryToMapValidateOptions](./ts-json-base.jsonfile.idirectorytomapvalidateoptions.md) | Options controlling validation of a directory to a <code>Map</code>. |
|  [IDirectoryValidateOptions](./ts-json-base.jsonfile.idirectoryvalidateoptions.md) | Options for directory validation. |
|  [IJsonFsHelperConfig](./ts-json-base.jsonfile.ijsonfshelperconfig.md) | Configuration for [JsonFsHelper](./ts-json-base.jsonfile.jsonfshelper.md)<!-- -->. |
|  [IJsonLike](./ts-json-base.jsonfile.ijsonlike.md) |  |
|  [IReadDirectoryItem](./ts-json-base.jsonfile.ireaddirectoryitem.md) | Return value for one item in a directory conversion. |

## Variables

|  Variable | Description |
|  --- | --- |
|  [DefaultJsonFsHelper](./ts-json-base.jsonfile.defaultjsonfshelper.md) |  |
|  [DefaultJsonFsHelperConfig](./ts-json-base.jsonfile.defaultjsonfshelperconfig.md) | Default configuration for [JsonFsHelper](./ts-json-base.jsonfile.jsonfshelper.md)<!-- -->. |
|  [DefaultJsonLike](./ts-json-base.jsonfile.defaultjsonlike.md) |  |

## Type Aliases

|  Type Alias | Description |
|  --- | --- |
|  [ItemNameTransformFunction](./ts-json-base.jsonfile.itemnametransformfunction.md) | Function to transform the name of a some entity, given an original name and the contents of the entity. |
|  [JsonFsDirectoryOptions](./ts-json-base.jsonfile.jsonfsdirectoryoptions.md) | Options for directory conversion or validation. |
|  [JsonFsDirectoryToMapOptions](./ts-json-base.jsonfile.jsonfsdirectorytomapoptions.md) | Options controlling processing of a directory to a <code>Map</code>. |
|  [JsonFsHelperInitOptions](./ts-json-base.jsonfile.jsonfshelperinitoptions.md) | Initialization options for [JsonFsHelper](./ts-json-base.jsonfile.jsonfshelper.md)<!-- -->. |
|  [JsonReplacer](./ts-json-base.jsonfile.jsonreplacer.md) |  |
|  [JsonReplacerArray](./ts-json-base.jsonfile.jsonreplacerarray.md) |  |
|  [JsonReplacerFunction](./ts-json-base.jsonfile.jsonreplacerfunction.md) |  |
|  [JsonReviver](./ts-json-base.jsonfile.jsonreviver.md) |  |

