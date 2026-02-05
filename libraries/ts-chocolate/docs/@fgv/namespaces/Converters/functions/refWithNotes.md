[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Converters](../README.md) / refWithNotes

# Function: refWithNotes()

> **refWithNotes**\<`TId`\>(`idConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRefWithNotes`](../../Model/interfaces/IRefWithNotes.md)\<`TId`\>\>

Defined in: [ts-chocolate/src/packlets/common/converters.ts:788](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/converters.ts#L788)

Creates a converter for [IRefWithNotes\\<TId\\>](../../Model/interfaces/IRefWithNotes.md) objects.
A simple reference with an ID and optional notes.

## Type Parameters

### TId

`TId` *extends* `string`

The ID type

## Parameters

### idConverter

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Converter for the ID type

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRefWithNotes`](../../Model/interfaces/IRefWithNotes.md)\<`TId`\>\>

A converter that produces IRefWithNotes objects
