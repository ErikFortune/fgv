[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-transformers](../README.md) / SummarizationPipeline

# Interface: SummarizationPipeline()

Summarization pipeline using sequence-to-sequence language models.

**Example:** Summarization with `Xenova/distilbart-cnn-6-6`.
```javascript
import { pipeline } from '@huggingface/transformers';

const summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
const text = 'The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, ' +
  'and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. ' +
  'During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest ' +
  'man-made structure in the world, a title it held for 41 years until the Chrysler Building in New ' +
  'York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to ' +
  'the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the ' +
  'Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second ' +
  'tallest free-standing structure in France after the Millau Viaduct.';
const output = await summarizer(text, {
  max_new_tokens: 100,
});
// [{ summary_text: ' The Eiffel Tower is about the same height as an 81-storey building and the tallest structure in Paris. It is the second tallest free-standing structure in France after the Millau Viaduct.' }]
```

## Extends

- `SummarizationPipeline_base`

> **SummarizationPipeline**(`texts`, `options?`): `Promise`\<`SummarizationOutput`\>

Summarization pipeline using sequence-to-sequence language models.

**Example:** Summarization with `Xenova/distilbart-cnn-6-6`.
```javascript
import { pipeline } from '@huggingface/transformers';

const summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
const text = 'The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, ' +
  'and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. ' +
  'During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest ' +
  'man-made structure in the world, a title it held for 41 years until the Chrysler Building in New ' +
  'York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to ' +
  'the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the ' +
  'Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second ' +
  'tallest free-standing structure in France after the Millau Viaduct.';
const output = await summarizer(text, {
  max_new_tokens: 100,
});
// [{ summary_text: ' The Eiffel Tower is about the same height as an 81-storey building and the tallest structure in Paris. It is the second tallest free-standing structure in France after the Millau Viaduct.' }]
```

## Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | `string` \| `string`[] |
| `options?` | `GenerationFunctionParameters` |

## Returns

`Promise`\<`SummarizationOutput`\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-_key"></a> `_key` | `"summary_text"` | - |
| <a id="property-dispose"></a> `dispose` | `DisposeType` | A promise that resolves when the pipeline has been disposed. |
| <a id="property-model"></a> `model` | `PreTrainedModel` | The model used by the pipeline. |
| <a id="property-task"></a> `task` | `string` | The task of the pipeline. Useful for specifying subtasks. |
| <a id="property-tokenizer"></a> `tokenizer` | `PreTrainedTokenizer` | The tokenizer used by the pipeline. |
