[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IFencedStringifiedJsonOptions

# Interface: IFencedStringifiedJsonOptions\<T\>

Options for the validating overload of [AiAssist.fencedStringifiedJson](../functions/fencedStringifiedJson.md).
`inner` is required so the typed `Converter<T>` return value can never lie
about the runtime shape.

## Extends

- [`IFencedStringifiedJsonExtractorOptions`](IFencedStringifiedJsonExtractorOptions.md)

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-extractor"></a> `extractor?` | `readonly` | [`JsonTextExtractor`](../type-aliases/JsonTextExtractor.md) | Optional pre-parse extractor. Defaults to [AiAssist.extractJsonText](../variables/extractJsonText.md). Provide a custom extractor to handle response shapes the default does not understand. |
| <a id="property-inner"></a> `inner` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | Inner converter or validator applied to the parsed JSON value. |
