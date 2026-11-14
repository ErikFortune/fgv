[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / fencedStringifiedJson

# Function: fencedStringifiedJson()

## Call Signature

> **fencedStringifiedJson**(`options?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>

Creates a `Converter` that accepts raw LLM response text, runs it through a
tolerant extractor (default: [AiAssist.extractJsonText](../variables/extractJsonText.md)), parses the
extracted substring as JSON, and applies an optional inner converter or
validator.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IFencedStringifiedJsonExtractorOptions`](../interfaces/IFencedStringifiedJsonExtractorOptions.md) | Optional extractor; omit to keep the default. Without an `inner` step, the converter resolves to the parsed `JsonValue`. |

### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>

A `Converter<JsonValue>`.

### Example

```ts
const converter = fencedStringifiedJson({ inner: myShapeConverter });
const result = converter.convert(llmText); // Result<MyShape>
```

## Call Signature

> **fencedStringifiedJson**\<`T`\>(`options`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Creates a `Converter` that accepts raw LLM response text, runs it through a
tolerant extractor (default: [AiAssist.extractJsonText](../variables/extractJsonText.md)), parses the
extracted substring as JSON, and applies the supplied inner converter or
validator.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`IFencedStringifiedJsonOptions`](../interfaces/IFencedStringifiedJsonOptions.md)\<`T`\> | Required `inner` converter/validator and optional extractor. |

### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

A `Converter<T>`.
