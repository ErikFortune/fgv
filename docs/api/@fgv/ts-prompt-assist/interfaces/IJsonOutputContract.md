[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IJsonOutputContract

# Interface: IJsonOutputContract

JSON output contract; the prompt's output is parsed and run through a
registered Converter (and the descriptor's `outputValidations` chain).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-converterid"></a> `converterId` | `readonly` | [`ConverterId`](../type-aliases/ConverterId.md) | Registered Converter id that types the parsed output. |
| <a id="property-kind"></a> `kind` | `readonly` | `"json"` | Discriminator for the output-contract union. |
