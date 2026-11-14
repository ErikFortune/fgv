[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IFsFileTreeInitParams

# Interface: IFsFileTreeInitParams\<TCT\>

Initialization parameters for [FsFileTreeAccessors](../classes/FsFileTreeAccessors.md).

## Remarks

Adds the filesystem-only confinement options to the shared
[IFileTreeInitParams](IFileTreeInitParams.md). Both options need a
`prefix` to confine to: creating accessors with `absolutePathPolicy` other than
`'unconfined'`, or with `realPath: true`, and no prefix fails.

## Extends

- [`IFileTreeInitParams`](IFileTreeInitParams.md)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-absolutepathpolicy"></a> `absolutePathPolicy?` | [`FsAbsolutePathPolicy`](../type-aliases/FsAbsolutePathPolicy.md) | How a path that resolves outside `prefix` is treated, for every operation — reads, listings, stats and writes alike. Defaults to `'unconfined'`, which is the behaviour of accessors created without this option. |
| <a id="property-infercontenttype"></a> `inferContentType?` | [`ContentTypeFactory`](../type-aliases/ContentTypeFactory.md)\<`TCT`\> | - |
| <a id="property-mutable"></a> `mutable?` | `boolean` \| [`IFilterSpec`](IFilterSpec.md) | Controls mutability of the file tree. - `undefined` or `false`: No files are mutable. - `true`: All files are mutable. - `IFilterSpec`: Only files matching the filter are mutable. |
| <a id="property-prefix"></a> `prefix?` | `string` | - |
| <a id="property-realpath"></a> `realPath?` | `boolean` | When `true`, every operation also checks the real path of what it touches — symbolic links followed — and refuses one that leads outside the real path of the prefix. Defaults to `true` under `'verified'` and `false` otherwise; requires `'confined'` or `'verified'`. |
