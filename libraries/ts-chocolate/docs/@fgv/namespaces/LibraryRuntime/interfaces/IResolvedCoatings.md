[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedCoatings

# Interface: IResolvedCoatings

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1344](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1344)

Resolved coatings specification for rolled truffles.
Coatings are ingredient-based (e.g., cocoa powder, chopped nuts).

## Properties

### entity

> `readonly` **entity**: [`ICoatingsEntity`](../../Entities/namespaces/Confections/type-aliases/ICoatingsEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1350](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1350)

The original coatings spec

***

### options

> `readonly` **options**: readonly [`IResolvedCoatingOption`](IResolvedCoatingOption.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1346](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1346)

All available coating ingredient options

***

### preferred?

> `readonly` `optional` **preferred**: [`IResolvedCoatingOption`](IResolvedCoatingOption.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1348](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1348)

The preferred/default coating (resolved ingredient)
