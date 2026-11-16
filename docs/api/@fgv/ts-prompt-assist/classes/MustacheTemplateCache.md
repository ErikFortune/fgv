[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / MustacheTemplateCache

# Class: MustacheTemplateCache

Bounded LRU cache for parsed `MustacheTemplate` instances keyed by
`(promptId, body-hash)`. Cardinality is bounded by the prompt-corpus
body count, fully appropriate to cache (vs rendered outputs which are
combinatorial in the open qualifier-value space — those are explicitly
not cached per design §15.5).

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Current entry count (for tests / observability).

##### Returns

`number`

## Methods

### getOrParse()

> **getOrParse**(`promptId`, `body`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`MustacheTemplate`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>

Returns the parsed template for `(promptId, body)`. On a cache miss
the template is parsed (with `escape: 'none'`, per design §6) and
inserted with LRU eviction.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `promptId` | [`PromptId`](../type-aliases/PromptId.md) |
| `body` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`MustacheTemplate`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>

***

### create()

> `static` **create**(`cap?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`MustacheTemplateCache`\>

Family-convention factory.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `cap?` | `number` | `DEFAULT_CAP` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`MustacheTemplateCache`\>
