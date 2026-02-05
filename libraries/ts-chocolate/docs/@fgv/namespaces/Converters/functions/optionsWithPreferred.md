[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Converters](../README.md) / optionsWithPreferred

# Function: optionsWithPreferred()

> **optionsWithPreferred**\<`TOption`, `TId`\>(`optionConverter`, `idConverter`, `context?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<`TOption`, `TId`\>\>

Defined in: [ts-chocolate/src/packlets/common/converters.ts:714](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/converters.ts#L714)

Creates a converter for [IOptionsWithPreferred\\<TOption, TId\\>](../../Model/interfaces/IOptionsWithPreferred.md) collections.
Validates that preferredId (if specified) exists in the options array.

## Type Parameters

### TOption

`TOption` *extends* [`IHasId`](../../Model/interfaces/IHasId.md)\<`TId`\>

The option object type (must have an `id` property)

### TId

`TId` *extends* `string`

The ID type for the preferred selection

## Parameters

### optionConverter

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TOption`\>

Converter for individual option objects

### idConverter

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Converter for the ID type (used for preferredId)

### context?

`string`

Optional context string for error messages

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<`TOption`, `TId`\>\>

A converter that produces validated IOptionsWithPreferred collections
