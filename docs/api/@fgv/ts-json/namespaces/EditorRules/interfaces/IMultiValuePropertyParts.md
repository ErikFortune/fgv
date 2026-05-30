[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [EditorRules](../README.md) / IMultiValuePropertyParts

# Interface: IMultiValuePropertyParts

Represents the parts of a multi-value property key.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="asarray"></a> `asArray` | `readonly` | `boolean` | If `true`, the resolved values are added as an array with the name of the [propertyVariable](#propertyvariable). If false, values are added as individual properties with names that correspond the value. |
| <a id="propertyvalues"></a> `propertyValues` | `readonly` | `string`[] | The set of property values to be expanded. |
| <a id="propertyvariable"></a> `propertyVariable` | `readonly` | `string` | The name of the variable used to project each possible property value into the child values or objects being resolved. |
| <a id="token"></a> `token` | `readonly` | `string` | The original matched token. |
