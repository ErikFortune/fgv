[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / generateUniqueBaseId

# Function: generateUniqueBaseId()

> **generateUniqueBaseId**(`baseId`, `existingIds`, `maxAttempts`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:449](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/helpers.ts#L449)

Generate a unique base ID by appending a counter if needed.

## Parameters

### baseId

`string`

Base ID to make unique

### existingIds

Set of existing IDs to check against

readonly `string`[] | `ReadonlySet`\<`string`\>

### maxAttempts

`number` = `1000`

Maximum number of attempts (default: 1000)

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Result containing unique base ID or failure
