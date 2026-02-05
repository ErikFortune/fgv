[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IFillingRecipeEntity

# Interface: IFillingRecipeEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:273](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L273)

Complete filling recipe with version history

## Properties

### baseId

> `readonly` **baseId**: [`BaseFillingId`](../../../../type-aliases/BaseFillingId.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:277](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L277)

Base filling recipe identifier (unique within source)

***

### category

> `readonly` **category**: [`FillingCategory`](../type-aliases/FillingCategory.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:287](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L287)

Category for classifying the filling recipe type

***

### derivedFrom?

> `readonly` `optional` **derivedFrom**: [`IFillingDerivationEntity`](../namespaces/Fillings/interfaces/IFillingDerivationEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:313](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L313)

Optional derivation info - tracks lineage if this filling recipe was forked
from another filling recipe (e.g., when editing a read-only filling recipe)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:292](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L292)

Optional description of the filling recipe

***

### goldenVersionSpec

> `readonly` **goldenVersionSpec**: [`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:307](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L307)

The ID of the golden (approved default) version

***

### name

> `readonly` **name**: [`FillingName`](../../../../type-aliases/FillingName.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:282](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L282)

Human-readable filling recipe name

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:297](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L297)

Optional tags for categorization and search

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:318](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L318)

Optional categorized URLs for external resources (tutorials, videos, etc.)

***

### versions

> `readonly` **versions**: readonly [`IFillingRecipeVersionEntity`](IFillingRecipeVersionEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:302](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L302)

Version history
