[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Bundle](../README.md) / IBundleExportMetadata

# Interface: IBundleExportMetadata

Optional export metadata for tracking bundle export information.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="exportedat"></a> `exportedAt` | `string` | ISO timestamp indicating when the bundle was exported. |
| <a id="exportedfrom"></a> `exportedFrom` | `string` | Tool or application that exported the bundle. |
| <a id="filtercontext"></a> `filterContext?` | `Record`\<`string`, `unknown`\> | Optional filter context if the bundle represents filtered data. |
| <a id="type"></a> `type` | `string` | Type of bundle export (e.g., 'ts-res-bundle', 'ts-res-bundle-filtered'). |
