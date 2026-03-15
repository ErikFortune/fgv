[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / ILocalStorageTreeParams

# Interface: ILocalStorageTreeParams\<TCT\>

Configuration for LocalStorageTreeAccessors.

## Extends

- [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="autosync"></a> `autoSync?` | `boolean` | If true, automatically sync changes to localStorage on every modification. If false (default), changes are only synced when syncToDisk() is called. |
| <a id="infercontenttype"></a> `inferContentType?` | [`ContentTypeFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | - |
| <a id="mutable"></a> `mutable?` | `boolean` \| [`IFilterSpec`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Controls mutability of the file tree. - `undefined` or `false`: No files are mutable. - `true`: All files are mutable. - `IFilterSpec`: Only files matching the filter are mutable. |
| <a id="pathtokeymap"></a> `pathToKeyMap` | `Record`\<`string`, `string`\> | Map of directory path prefixes to localStorage keys. Files under each prefix are stored in the corresponding localStorage key. Example: { '/data/ingredients': 'myapp:ingredients:v1' } |
| <a id="prefix"></a> `prefix?` | `string` | - |
| <a id="storage"></a> `storage?` | `Storage` | Storage instance to use. Defaults to window.localStorage. Can be overridden for testing with mock storage. |
