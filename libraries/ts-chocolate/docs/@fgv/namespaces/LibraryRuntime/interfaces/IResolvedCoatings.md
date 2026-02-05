[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedCoatings

# Interface: IResolvedCoatings

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1339](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1339)

Resolved coatings specification for rolled truffles.
Coatings are ingredient-based (e.g., cocoa powder, chopped nuts).

## Properties

### entity

> `readonly` **entity**: [`ICoatingsEntity`](../../Entities/namespaces/Confections/type-aliases/ICoatingsEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1345](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1345)

The original coatings spec

***

### options

> `readonly` **options**: readonly [`IResolvedCoatingOption`](IResolvedCoatingOption.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1341](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1341)

All available coating ingredient options

***

### preferred?

> `readonly` `optional` **preferred**: [`IResolvedCoatingOption`](IResolvedCoatingOption.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1343](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1343)

The preferred/default coating (resolved ingredient)
