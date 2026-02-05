[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedConfectionMoldRef

# Interface: IResolvedConfectionMoldRef

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1304](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1304)

A resolved mold reference with the full mold object.

## Properties

### entity

> `readonly` **entity**: [`IConfectionMoldRef`](../../Entities/namespaces/Confections/type-aliases/IConfectionMoldRef.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1312](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1312)

The original mold entity reference data

***

### id

> `readonly` **id**: [`MoldId`](../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1306](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1306)

The mold ID (for IOptionsWithPreferred compatibility)

***

### mold

> `readonly` **mold**: [`IMold`](IMold.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1308](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1308)

The resolved mold object

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1310](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1310)

Optional notes specific to using this mold
