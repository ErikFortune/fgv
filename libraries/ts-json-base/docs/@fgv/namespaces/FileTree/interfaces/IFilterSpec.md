[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / IFilterSpec

# Interface: IFilterSpec

Filter specification for controlling which paths are mutable.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="exclude"></a> `exclude?` | (`string` \| `RegExp`)[] | Paths or patterns to exclude. Matching paths are not mutable. |
| <a id="include"></a> `include?` | (`string` \| `RegExp`)[] | Paths or patterns to include. If specified, only matching paths are mutable. |
