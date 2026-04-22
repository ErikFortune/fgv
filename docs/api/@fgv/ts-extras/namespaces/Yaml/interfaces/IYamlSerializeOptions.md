[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Yaml](../README.md) / IYamlSerializeOptions

# Interface: IYamlSerializeOptions

Options for YAML serialization, mirroring commonly-used `js-yaml` `DumpOptions`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="flowlevel"></a> `flowLevel?` | `readonly` | `number` | Nesting level at which to switch from block to flow style. -1 means block style everywhere (default: -1). |
| <a id="forcequotes"></a> `forceQuotes?` | `readonly` | `boolean` | If true, all non-key strings will be quoted (default: false). |
| <a id="indent"></a> `indent?` | `readonly` | `number` | Indentation width in spaces (default: 2). |
| <a id="linewidth"></a> `lineWidth?` | `readonly` | `number` | Maximum line width (default: 80). |
| <a id="noarrayindent"></a> `noArrayIndent?` | `readonly` | `boolean` | If true, don't add an indentation level to array elements (default: false). |
| <a id="norefs"></a> `noRefs?` | `readonly` | `boolean` | If true, don't convert duplicate objects into references (default: false). |
| <a id="sortkeys"></a> `sortKeys?` | `readonly` | `boolean` | If true, sort keys when dumping (default: false). |
