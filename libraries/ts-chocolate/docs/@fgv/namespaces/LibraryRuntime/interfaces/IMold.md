[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IMold

# Interface: IMold

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:65](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L65)

A resolved runtime view of a mold with computed properties.

This interface provides runtime-layer access to mold data with:
- Composite identity (`id`, `sourceId`) for cross-source references
- Computed properties (totalCapacity, displayName)
- Future navigation capabilities

## Properties

### baseId

> `readonly` **baseId**: [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:82](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L82)

The base mold ID within the source.

***

### cavities

> `readonly` **cavities**: [`ICavities`](../../Entities/type-aliases/ICavities.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:96](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L96)

Cavities definition (grid or count)

***

### cavityCount

> `readonly` **cavityCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:99](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L99)

Number of cavities in the mold

***

### cavityDimensions?

> `readonly` `optional` **cavityDimensions**: [`ICavityDimensions`](../../Entities/interfaces/ICavityDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:105](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L105)

Physical dimensions of each cavity

***

### cavityWeight?

> `readonly` `optional` **cavityWeight**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:102](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L102)

Weight capacity per cavity in grams

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:77](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L77)

The collection ID part of the composite ID.

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:93](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L93)

Human-readable description

***

### displayName

> `readonly` **displayName**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:134](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L134)

Gets a display string for this mold (manufacturer + product number).
Example: "Chocolate World CW 2227"

***

### entity

> `readonly` **entity**: [`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:141](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L141)

Gets the underlying raw mold data.

***

### format

> `readonly` **format**: [`MoldFormat`](../../../../type-aliases/MoldFormat.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:108](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L108)

Mold format/series

***

### id

> `readonly` **id**: [`MoldId`](../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:72](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L72)

The composite mold ID (e.g., "cw.cw-2227").
Combines source and base ID for unique identification across sources.

***

### manufacturer

> `readonly` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:87](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L87)

Manufacturer of the mold

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:117](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L117)

Optional categorized notes

***

### productNumber

> `readonly` **productNumber**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:90](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L90)

Product number from the manufacturer

***

### related?

> `readonly` `optional` **related**: readonly [`MoldId`](../../../../type-aliases/MoldId.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:114](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L114)

Optional related molds (cross-catalog via composite IDs)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:111](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L111)

Optional tags

***

### totalCapacity

> `readonly` **totalCapacity**: [`Measurement`](../../../../type-aliases/Measurement.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:128](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L128)

Gets the total capacity of the mold (all cavities) in grams.
Returns undefined if cavityWeight is not defined.

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/model.ts:120](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/molds/model.ts#L120)

Optional categorized URLs
