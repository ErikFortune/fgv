[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / validateOptionsWithPreferred

# Function: validateOptionsWithPreferred()

> **validateOptionsWithPreferred**\<`TOption`, `TId`\>(`collection`, `context?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<`TOption`, `TId`\>\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:754](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/validation.ts#L754)

Validates that preferredId (if specified) exists in the options array.

## Type Parameters

### TOption

`TOption` *extends* [`IHasId`](../../Model/interfaces/IHasId.md)\<`TId`\>

The option object type

### TId

`TId` *extends* `string`

The ID type

## Parameters

### collection

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<`TOption`, `TId`\>

The options collection to validate

### context?

`string`

Optional context string for error messages

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<`TOption`, `TId`\>\>

Success with the collection if valid, Failure if preferredId is not found in options
