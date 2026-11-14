[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-transformers](../README.md) / TextClassificationPipeline

# Interface: TextClassificationPipeline()

Text classification pipeline using `AutoModelForSequenceClassification`.

**Example:** Sentiment analysis with `Xenova/distilbert-base-uncased-finetuned-sst-2-english`.
```javascript
import { pipeline } from '@huggingface/transformers';

const classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
const output = await classifier('I love transformers!');
// [{ label: 'POSITIVE', score: 0.999788761138916 }]
```

**Example:** Multilingual sentiment analysis with `Xenova/bert-base-multilingual-uncased-sentiment` (and return the top 5 classes).
```javascript
import { pipeline } from '@huggingface/transformers';

const classifier = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
const output = await classifier('Le meilleur film de tous les temps.', { top_k: 5 });
// [
//   { label: '5 stars', score: 0.9610759615898132 },
//   { label: '4 stars', score: 0.03323351591825485 },
//   { label: '3 stars', score: 0.0036155181005597115 },
//   { label: '1 star', score: 0.0011325967498123646 },
//   { label: '2 stars', score: 0.0009423971059732139 }
// ]
```

**Example:** Toxic comment classification with `Xenova/toxic-bert` (and return all classes).
```javascript
import { pipeline } from '@huggingface/transformers';

const classifier = await pipeline('text-classification', 'Xenova/toxic-bert');
const output = await classifier('I hate you!', { top_k: null });
// [
//   { label: 'toxic', score: 0.9593140482902527 },
//   { label: 'insult', score: 0.16187334060668945 },
//   { label: 'obscene', score: 0.03452680632472038 },
//   { label: 'identity_hate', score: 0.0223250575363636 },
//   { label: 'threat', score: 0.019197041168808937 },
//   { label: 'severe_toxic', score: 0.005651099607348442 }
// ]
```

## Extends

- `TextClassificationPipeline_base`

> **TextClassificationPipeline**\<`Q`, `O`\>(`texts`, `options?`): `Promise`\<`TextClassificationPipelineResult`\<`Q`, `O`\>\>

Text classification pipeline using `AutoModelForSequenceClassification`.

**Example:** Sentiment analysis with `Xenova/distilbert-base-uncased-finetuned-sst-2-english`.
```javascript
import { pipeline } from '@huggingface/transformers';

const classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
const output = await classifier('I love transformers!');
// [{ label: 'POSITIVE', score: 0.999788761138916 }]
```

**Example:** Multilingual sentiment analysis with `Xenova/bert-base-multilingual-uncased-sentiment` (and return the top 5 classes).
```javascript
import { pipeline } from '@huggingface/transformers';

const classifier = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
const output = await classifier('Le meilleur film de tous les temps.', { top_k: 5 });
// [
//   { label: '5 stars', score: 0.9610759615898132 },
//   { label: '4 stars', score: 0.03323351591825485 },
//   { label: '3 stars', score: 0.0036155181005597115 },
//   { label: '1 star', score: 0.0011325967498123646 },
//   { label: '2 stars', score: 0.0009423971059732139 }
// ]
```

**Example:** Toxic comment classification with `Xenova/toxic-bert` (and return all classes).
```javascript
import { pipeline } from '@huggingface/transformers';

const classifier = await pipeline('text-classification', 'Xenova/toxic-bert');
const output = await classifier('I hate you!', { top_k: null });
// [
//   { label: 'toxic', score: 0.9593140482902527 },
//   { label: 'insult', score: 0.16187334060668945 },
//   { label: 'obscene', score: 0.03452680632472038 },
//   { label: 'identity_hate', score: 0.0223250575363636 },
//   { label: 'threat', score: 0.019197041168808937 },
//   { label: 'severe_toxic', score: 0.005651099607348442 }
// ]
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-q"></a> `Q` *extends* `string` \| `string`[] | - |
| <a id="type-parameter-o"></a> `O` *extends* `TextClassificationPipelineOptions` | `object` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | `Q` |
| `options?` | `O` |

## Returns

`Promise`\<`TextClassificationPipelineResult`\<`Q`, `O`\>\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-dispose"></a> `dispose` | `DisposeType` | A promise that resolves when the pipeline has been disposed. |
| <a id="property-model"></a> `model` | `PreTrainedModel` | The model used by the pipeline. |
| <a id="property-task"></a> `task` | `string` | The task of the pipeline. Useful for specifying subtasks. |
| <a id="property-tokenizer"></a> `tokenizer` | `PreTrainedTokenizer` | The tokenizer used by the pipeline. |

## Methods

### \_call()

> **\_call**(`texts`, `__namedParameters?`): `Promise`\<\{ `label`: `any`; `score`: `any`; \} \| (\{ `label`: `any`; `score`: `any`; \} \| `object`[])[]\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | `any` |
| `__namedParameters?` | \{ `top_k?`: `number`; \} |
| `__namedParameters.top_k?` | `number` |

#### Returns

`Promise`\<\{ `label`: `any`; `score`: `any`; \} \| (\{ `label`: `any`; `score`: `any`; \} \| `object`[])[]\>
