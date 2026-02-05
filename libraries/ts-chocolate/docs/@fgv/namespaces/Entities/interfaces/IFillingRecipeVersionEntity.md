[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IFillingRecipeVersionEntity

# Interface: IFillingRecipeVersionEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:197](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L197)

Complete details for a single version of a filling recipe

## Properties

### baseWeight

> `readonly` **baseWeight**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:216](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L216)

Base weight of the filling recipe (sum of all ingredient amounts)

***

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:206](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L206)

Date this version was created (ISO 8601 format)

***

### ingredients

> `readonly` **ingredients**: readonly [`IFillingIngredientEntity`](../namespaces/Fillings/interfaces/IFillingIngredientEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:211](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L211)

Ingredients used in this version of the filling recipe

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:226](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L226)

Optional categorized notes about this version

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IProcedureRefEntity`](../namespaces/Fillings/type-aliases/IProcedureRefEntity.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:237](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L237)

Optional procedures associated with this version.
Contains applicable procedures and the preferred default.

***

### ratings?

> `readonly` `optional` **ratings**: readonly [`IFillingRating`](IFillingRating.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:231](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L231)

Optional ratings for this version

***

### versionSpec

> `readonly` **versionSpec**: [`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:201](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L201)

Unique identifier for this version

***

### yield?

> `readonly` `optional` **yield**: `string`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:221](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L221)

Optional yield description (e.g., "50 bonbons")
