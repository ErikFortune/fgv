[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / validateIdsWithPreferred

# Function: validateIdsWithPreferred()

> **validateIdsWithPreferred**\<`TId`\>(`collection`, `context?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:778](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/validation.ts#L778)

Validates that preferredId (if specified) exists in the ids array.

## Type Parameters

### TId

`TId` *extends* `string`

The ID type

## Parameters

### collection

[`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>

The IDs collection to validate

### context?

`string`

Optional context string for error messages

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>\>

Success with the collection if valid, Failure if preferredId is not found in ids
