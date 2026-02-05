[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISaveAnalysis

# Interface: ISaveAnalysis

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:54](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L54)

Analysis of save options and recommendations based on session changes.

## Properties

### canAddAlternatives

> `readonly` **canAddAlternatives**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:63](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L63)

Whether we can add ingredients as alternatives to the original recipe

***

### canCreateVersion

> `readonly` **canCreateVersion**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:58](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L58)

Whether the original collection is mutable (allows creating new version)

***

### changes

> `readonly` **changes**: `object`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:78](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L78)

Detailed change information

#### ingredientsAdded

> `readonly` **ingredientsAdded**: `boolean`

#### ingredientsChanged

> `readonly` **ingredientsChanged**: `boolean`

#### ingredientsRemoved

> `readonly` **ingredientsRemoved**: `boolean`

#### notesChanged

> `readonly` **notesChanged**: `boolean`

#### weightChanged

> `readonly` **weightChanged**: `boolean`

***

### mustCreateNew

> `readonly` **mustCreateNew**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:68](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L68)

Whether we must create a new recipe (collection is immutable)

***

### recommendedOption

> `readonly` **recommendedOption**: `"new"` \| `"version"` \| `"alternatives"`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:73](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L73)

Recommended save option based on changes
