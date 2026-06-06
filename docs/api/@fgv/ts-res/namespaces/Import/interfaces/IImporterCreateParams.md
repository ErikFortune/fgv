[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Import](../README.md) / IImporterCreateParams

# Interface: IImporterCreateParams

Parameters for creating an [ImportManager](../classes/ImportManager.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filecontentconverter"></a> `fileContentConverter?` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md), `unknown`\> | An optional converter used to pre-process file contents before JSON import validation. |
| <a id="filecontentextensions"></a> `fileContentExtensions?` | readonly `string`[] | Optional file extensions which should be parsed using the supplied file content converter. |
| <a id="filetree"></a> `fileTree?` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\> | An optional `FileTree` for importing path items. |
| <a id="importers"></a> `importers?` | [`IImporter`](../namespaces/Importers/interfaces/IImporter.md)[] | An optional list of [importers](../namespaces/Importers/interfaces/IImporter.md) to use for the import. |
| <a id="initialcontext"></a> `initialContext?` | [`ImportContext`](../classes/ImportContext.md) | An optional initial [import context](../classes/ImportContext.md) for the import operation. |
| <a id="resources"></a> `resources` | [`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md) | The [resource manager builder](../../../classes/ResourceManagerBuilder.md) into which resources will be imported. |
