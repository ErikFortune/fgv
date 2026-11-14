[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / IUrlConfigOptions

# Interface: IUrlConfigOptions

Configuration options that can be passed via URL parameters

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `string` | Configuration name or path |
| <a id="property-configstartdir"></a> `configStartDir?` | `string` | Starting directory for config file picker (derived from config path) |
| <a id="property-contextfilter"></a> `contextFilter?` | `string` | Context filter token (pipe-separated) |
| <a id="property-input"></a> `input?` | `string` | Input file path |
| <a id="property-inputstartdir"></a> `inputStartDir?` | `string` | Starting directory for input file picker (derived from input path) |
| <a id="property-interactive"></a> `interactive?` | `boolean` | Whether to launch in interactive mode |
| <a id="property-loadzip"></a> `loadZip?` | `boolean` | Whether to use ZIP loading mode |
| <a id="property-maxdistance"></a> `maxDistance?` | `number` | Maximum distance for language matching |
| <a id="property-qualifierdefaults"></a> `qualifierDefaults?` | `string` | Qualifier defaults token (pipe-separated) |
| <a id="property-reducequalifiers"></a> `reduceQualifiers?` | `boolean` | Whether to reduce qualifiers |
| <a id="property-resourcetypes"></a> `resourceTypes?` | `string` | Resource types filter (comma-separated) |
| <a id="property-zipfile"></a> `zipFile?` | `string` | Name of ZIP file to load from Downloads (filename only) |
| <a id="property-zippath"></a> `zipPath?` | `string` | Path to ZIP file to load (for CLI-generated ZIPs) |
