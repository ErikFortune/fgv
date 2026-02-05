[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / generateUniqueBaseIdFromName

# Function: generateUniqueBaseIdFromName()

> **generateUniqueBaseIdFromName**(`name`, `existingIds`, `maxAttempts`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:479](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/helpers.ts#L479)

Generate a unique base ID from a name.
Combines nameToBaseId and generateUniqueBaseId.

## Parameters

### name

`string`

Name to convert

### existingIds

Set of existing IDs to check against

readonly `string`[] | `ReadonlySet`\<`string`\>

### maxAttempts

`number` = `1000`

Maximum number of attempts (default: 1000)

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Result containing unique base ID or failure
