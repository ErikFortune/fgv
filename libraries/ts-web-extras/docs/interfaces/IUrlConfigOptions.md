[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / IUrlConfigOptions

# Interface: IUrlConfigOptions

Configuration options that can be passed via URL parameters

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="config"></a> `config?` | `string` | Configuration name or path |
| <a id="configstartdir"></a> `configStartDir?` | `string` | Starting directory for config file picker (derived from config path) |
| <a id="contextfilter"></a> `contextFilter?` | `string` | Context filter token (pipe-separated) |
| <a id="input"></a> `input?` | `string` | Input file path |
| <a id="inputstartdir"></a> `inputStartDir?` | `string` | Starting directory for input file picker (derived from input path) |
| <a id="interactive"></a> `interactive?` | `boolean` | Whether to launch in interactive mode |
| <a id="loadzip"></a> `loadZip?` | `boolean` | Whether to use ZIP loading mode |
| <a id="maxdistance"></a> `maxDistance?` | `number` | Maximum distance for language matching |
| <a id="qualifierdefaults"></a> `qualifierDefaults?` | `string` | Qualifier defaults token (pipe-separated) |
| <a id="reducequalifiers"></a> `reduceQualifiers?` | `boolean` | Whether to reduce qualifiers |
| <a id="resourcetypes"></a> `resourceTypes?` | `string` | Resource types filter (comma-separated) |
| <a id="zipfile"></a> `zipFile?` | `string` | Name of ZIP file to load from Downloads (filename only) |
| <a id="zippath"></a> `zipPath?` | `string` | Path to ZIP file to load (for CLI-generated ZIPs) |
