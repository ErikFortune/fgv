[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedConfectionMoldRef

# Interface: IResolvedConfectionMoldRef

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1332](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1332)

A resolved mold reference with the full mold object.

## Properties

### entity

> `readonly` **entity**: [`IConfectionMoldRef`](../../Entities/namespaces/Confections/type-aliases/IConfectionMoldRef.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1340](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1340)

The original mold entity reference data

***

### id

> `readonly` **id**: [`MoldId`](../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1334](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1334)

The mold ID (for IOptionsWithPreferred compatibility)

***

### mold

> `readonly` **mold**: [`IMold`](IMold.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1336](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1336)

The resolved mold object

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1338](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1338)

Optional notes specific to using this mold
