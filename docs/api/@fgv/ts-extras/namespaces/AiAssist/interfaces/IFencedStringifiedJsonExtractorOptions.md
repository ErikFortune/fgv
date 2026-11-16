[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IFencedStringifiedJsonExtractorOptions

# Interface: IFencedStringifiedJsonExtractorOptions

Options shared by every [AiAssist.fencedStringifiedJson](../functions/fencedStringifiedJson.md) call.

## Extended by

- [`IFencedStringifiedJsonOptions`](IFencedStringifiedJsonOptions.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-extractor"></a> `extractor?` | `readonly` | [`JsonTextExtractor`](../type-aliases/JsonTextExtractor.md) | Optional pre-parse extractor. Defaults to [AiAssist.extractJsonText](../variables/extractJsonText.md). Provide a custom extractor to handle response shapes the default does not understand. |
