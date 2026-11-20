[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res-ui-components](../../../../../README.md) / [DownloadTools](../../../README.md) / [DownloadUtils](../README.md) / IDownloadOptions

# Interface: IDownloadOptions

Options for customizing file downloads

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-basefilename"></a> `baseFilename?` | `string` | Base filename (without extension). If not provided, uses 'ts-res-export' |
| <a id="property-extension"></a> `extension?` | `string` | File extension (without dot). Defaults to 'json' |
| <a id="property-filenametransformer"></a> `filenameTransformer?` | (`baseFilename`) => `string` | Custom filename transformer function |
| <a id="property-includetimestamp"></a> `includeTimestamp?` | `boolean` | Include timestamp in filename. Defaults to true |
| <a id="property-mimetype"></a> `mimeType?` | `string` | MIME type for the blob. Defaults to 'application/json' for json, 'text/plain' for others |
| <a id="property-timestampformat"></a> `timestampFormat?` | `string` | Custom timestamp format. If not provided, uses ISO format with colons replaced |
