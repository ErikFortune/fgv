[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-transformers](../README.md) / FeatureExtractionPipeline

# Interface: FeatureExtractionPipeline()

Feature extraction pipeline using no model head. This pipeline extracts the hidden
states from the base transformer for use as features in downstream tasks.

**Example:** Run feature extraction using `onnx-community/all-MiniLM-L6-v2-ONNX` (without pooling or normalization).
```javascript
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX');
const output = await extractor('This is a simple test.');
// Tensor {
//   type: 'float32',
//   data: Float32Array [0.2157987803220749, -0.09140099585056305, ...],
//   dims: [1, 8, 384]
// }

// You can convert this Tensor to a nested JavaScript array using `.tolist()`:
console.log(output.tolist());
```

**Example:** Run feature extraction using `onnx-community/all-MiniLM-L6-v2-ONNX` (with pooling and normalization).
```javascript
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX');
const output = await extractor('This is a simple test.', { pooling: 'mean', normalize: true });
// Tensor {
//   type: 'float32',
//   data: Float32Array [0.09528215229511261, -0.024730168282985687, ...],
//   dims: [1, 384]
// }

// You can convert this Tensor to a nested JavaScript array using `.tolist()`:
console.log(output.tolist());
```

**Example:** Run feature extraction using `onnx-community/all-MiniLM-L6-v2-ONNX` with pooling and binary quantization.
```javascript
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX');
const output = await extractor('This is a simple test.', { pooling: 'mean', quantize: true, precision: 'binary' });
// Tensor {
//   type: 'int8',
//   data: Int8Array [49, 108, 25, ...],
//   dims: [1, 48]
// }

// You can convert this Tensor to a nested JavaScript array using `.tolist()`:
console.log(output.tolist());
```

## Extends

- `FeatureExtractionPipeline_base`

> **FeatureExtractionPipeline**(`texts`, `options?`): `Promise`\<[`Tensor`](Tensor.md)\>

Feature extraction pipeline using no model head. This pipeline extracts the hidden
states from the base transformer for use as features in downstream tasks.

**Example:** Run feature extraction using `onnx-community/all-MiniLM-L6-v2-ONNX` (without pooling or normalization).
```javascript
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX');
const output = await extractor('This is a simple test.');
// Tensor {
//   type: 'float32',
//   data: Float32Array [0.2157987803220749, -0.09140099585056305, ...],
//   dims: [1, 8, 384]
// }

// You can convert this Tensor to a nested JavaScript array using `.tolist()`:
console.log(output.tolist());
```

**Example:** Run feature extraction using `onnx-community/all-MiniLM-L6-v2-ONNX` (with pooling and normalization).
```javascript
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX');
const output = await extractor('This is a simple test.', { pooling: 'mean', normalize: true });
// Tensor {
//   type: 'float32',
//   data: Float32Array [0.09528215229511261, -0.024730168282985687, ...],
//   dims: [1, 384]
// }

// You can convert this Tensor to a nested JavaScript array using `.tolist()`:
console.log(output.tolist());
```

**Example:** Run feature extraction using `onnx-community/all-MiniLM-L6-v2-ONNX` with pooling and binary quantization.
```javascript
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX');
const output = await extractor('This is a simple test.', { pooling: 'mean', quantize: true, precision: 'binary' });
// Tensor {
//   type: 'int8',
//   data: Int8Array [49, 108, 25, ...],
//   dims: [1, 48]
// }

// You can convert this Tensor to a nested JavaScript array using `.tolist()`:
console.log(output.tolist());
```

## Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | `string` \| `string`[] |
| `options?` | `FeatureExtractionPipelineOptions` |

## Returns

`Promise`\<[`Tensor`](Tensor.md)\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-dispose"></a> `dispose` | `DisposeType` | A promise that resolves when the pipeline has been disposed. |
| <a id="property-model"></a> `model` | `PreTrainedModel` | The model used by the pipeline. |
| <a id="property-task"></a> `task` | `string` | The task of the pipeline. Useful for specifying subtasks. |
| <a id="property-tokenizer"></a> `tokenizer` | `PreTrainedTokenizer` | The tokenizer used by the pipeline. |

## Methods

### \_call()

> **\_call**(`texts`, `options?`): `Promise`\<[`Tensor`](Tensor.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | `string` \| `string`[] |
| `options?` | `FeatureExtractionPipelineOptions` |

#### Returns

`Promise`\<[`Tensor`](Tensor.md)\>
