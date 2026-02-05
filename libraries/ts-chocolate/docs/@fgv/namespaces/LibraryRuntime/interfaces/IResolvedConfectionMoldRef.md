[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedConfectionMoldRef

# Interface: IResolvedConfectionMoldRef

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1299](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1299)

A resolved mold reference with the full mold object.

## Properties

### entity

> `readonly` **entity**: [`IConfectionMoldRef`](../../Entities/namespaces/Confections/type-aliases/IConfectionMoldRef.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1307](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1307)

The original mold entity reference data

***

### id

> `readonly` **id**: [`MoldId`](../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1301](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1301)

The mold ID (for IOptionsWithPreferred compatibility)

***

### mold

> `readonly` **mold**: [`IMold`](IMold.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1303](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1303)

The resolved mold object

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1305](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1305)

Optional notes specific to using this mold
