[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Model](../README.md) / IRefWithNotes

# Interface: IRefWithNotes\<TId\>

Defined in: [ts-chocolate/src/packlets/common/model.ts:224](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/model.ts#L224)

Generic reference type with an ID and optional categorized notes.
Use as base for mold refs, procedure refs, etc.
Satisfies IHasId for use with IOptionsWithPreferred.

## Extends

- [`IHasId`](IHasId.md)\<`TId`\>

## Type Parameters

### TId

`TId` *extends* `string`

The ID type

## Properties

### id

> `readonly` **id**: `TId`

Defined in: [ts-chocolate/src/packlets/common/model.ts:226](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/model.ts#L226)

The referenced entity's ID

#### Overrides

[`IHasId`](IHasId.md).[`id`](IHasId.md#id)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/common/model.ts:228](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/model.ts#L228)

Optional categorized notes specific to this reference
