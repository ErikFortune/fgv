[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / IFileSystemAccessTreeParams

# Interface: IFileSystemAccessTreeParams\<TCT\>

Options for creating persistent file trees.

## Extends

- [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-autosync"></a> `autoSync?` | `boolean` | `false` | Automatically sync changes to disk immediately after each save. If false, changes are batched and written on explicit syncToDisk() call. |
| <a id="property-filepath"></a> `filePath?` | `string` | `undefined` | Override the path at which the file is stored in the tree (for fromFileHandle). Must be an absolute path (e.g., '/data/confections/common.yaml'). If omitted, defaults to `/<filename>`. |
| <a id="property-infercontenttype"></a> `inferContentType?` | [`ContentTypeFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | `undefined` | - |
| <a id="property-logger"></a> `logger?` | [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\> | `undefined` | Optional logger for auto-sync and persistence failures. |
| <a id="property-mutable"></a> `mutable?` | `boolean` \| [`IFilterSpec`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | `undefined` | Controls mutability of the file tree. - `undefined` or `false`: No files are mutable. - `true`: All files are mutable. - `IFilterSpec`: Only files matching the filter are mutable. |
| <a id="property-prefix"></a> `prefix?` | `string` | `undefined` | - |
| <a id="property-requirewritepermission"></a> `requireWritePermission?` | `boolean` | `true` | Require write permission on the directory handle. If true, fails if write permission cannot be obtained. If false, falls back to read-only mode. |
