[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedCoatings

# Interface: IResolvedCoatings

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1372](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1372)

Resolved coatings specification for rolled truffles.
Coatings are ingredient-based (e.g., cocoa powder, chopped nuts).

## Properties

### entity

> `readonly` **entity**: [`ICoatingsEntity`](../../Entities/namespaces/Confections/type-aliases/ICoatingsEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1378](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1378)

The original coatings spec

***

### options

> `readonly` **options**: readonly [`IResolvedCoatingOption`](IResolvedCoatingOption.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1374](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1374)

All available coating ingredient options

***

### preferred?

> `readonly` `optional` **preferred**: [`IResolvedCoatingOption`](IResolvedCoatingOption.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1376](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1376)

The preferred/default coating (resolved ingredient)
