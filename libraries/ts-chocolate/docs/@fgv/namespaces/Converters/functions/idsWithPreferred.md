[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Converters](../README.md) / idsWithPreferred

# Function: idsWithPreferred()

> **idsWithPreferred**\<`TId`\>(`idConverter`, `context?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>\>

Defined in: [ts-chocolate/src/packlets/common/converters.ts:743](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/converters.ts#L743)

Creates a converter for [IIdsWithPreferred\\<TId\\>](../../Model/interfaces/IIdsWithPreferred.md) collections.
Validates that preferredId (if specified) exists in the ids array.

## Type Parameters

### TId

`TId` *extends* `string`

The ID type

## Parameters

### idConverter

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Converter for individual IDs

### context?

`string`

Optional context string for error messages

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>\>

A converter that produces validated IIdsWithPreferred collections
