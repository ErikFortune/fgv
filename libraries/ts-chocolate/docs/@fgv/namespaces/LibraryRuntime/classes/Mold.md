[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / Mold

# Class: Mold

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:54](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L54)

A resolved view of a mold with computed properties.

Mold wraps a data-layer Mold and provides:
- Composite identity (MoldId) for cross-source references
- Computed properties (totalCapacity, displayName)
- Future navigation capabilities

## Implements

- [`IMold`](../interfaces/IMold.md)

## Accessors

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:100](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L100)

The base mold ID within the source

##### Returns

[`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

The base mold ID within the source.

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`baseId`](../interfaces/IMold.md#baseid)

***

### cavities

#### Get Signature

> **get** **cavities**(): [`ICavities`](../../Entities/type-aliases/ICavities.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:132](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L132)

Cavities definition (grid or count)

##### Returns

[`ICavities`](../../Entities/type-aliases/ICavities.md)

Cavities definition (grid or count)

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`cavities`](../interfaces/IMold.md#cavities)

***

### cavityCount

#### Get Signature

> **get** **cavityCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:139](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L139)

Number of cavities in the mold

##### Returns

`number`

Number of cavities in the mold

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`cavityCount`](../interfaces/IMold.md#cavitycount)

***

### cavityDimensions

#### Get Signature

> **get** **cavityDimensions**(): [`ICavityDimensions`](../../Entities/interfaces/ICavityDimensions.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:156](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L156)

Physical dimensions of each cavity

##### Returns

[`ICavityDimensions`](../../Entities/interfaces/ICavityDimensions.md) \| `undefined`

Physical dimensions of each cavity

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`cavityDimensions`](../interfaces/IMold.md#cavitydimensions)

***

### cavityWeight

#### Get Signature

> **get** **cavityWeight**(): [`Measurement`](../../../../type-aliases/Measurement.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:149](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L149)

Weight capacity per cavity in grams

##### Returns

[`Measurement`](../../../../type-aliases/Measurement.md) \| `undefined`

Weight capacity per cavity in grams

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`cavityWeight`](../interfaces/IMold.md#cavityweight)

***

### collectionId

#### Get Signature

> **get** **collectionId**(): [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:93](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L93)

The source ID part of the composite ID

##### Returns

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID part of the composite ID.

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`collectionId`](../interfaces/IMold.md#collectionid)

***

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:125](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L125)

Human-readable description

##### Returns

`string` \| `undefined`

Human-readable description

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`description`](../interfaces/IMold.md#description)

***

### displayName

#### Get Signature

> **get** **displayName**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:214](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L214)

Gets a display string for this mold.
Example: "Hex Swirl (Chocolate World CW-2227)"
Falls back to manufacturer + product number if no description.

##### Returns

`string`

Gets a display string for this mold (manufacturer + product number).
Example: "Chocolate World CW 2227"

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`displayName`](../interfaces/IMold.md#displayname)

***

### entity

#### Get Signature

> **get** **entity**(): [`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:225](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L225)

Gets the underlying mold data entity.

##### Returns

[`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md)

Gets the underlying raw mold data.

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`entity`](../interfaces/IMold.md#entity)

***

### format

#### Get Signature

> **get** **format**(): [`MoldFormat`](../../../../type-aliases/MoldFormat.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:163](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L163)

Mold format/series

##### Returns

[`MoldFormat`](../../../../type-aliases/MoldFormat.md)

Mold format/series

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`format`](../interfaces/IMold.md#format)

***

### id

#### Get Signature

> **get** **id**(): [`MoldId`](../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:86](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L86)

The composite mold ID (e.g., "cw.cw-2227")

##### Returns

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite mold ID (e.g., "cw.cw-2227").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`id`](../interfaces/IMold.md#id)

***

### manufacturer

#### Get Signature

> **get** **manufacturer**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:111](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L111)

Manufacturer of the mold

##### Returns

`string`

Manufacturer of the mold

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`manufacturer`](../interfaces/IMold.md#manufacturer)

***

### notes

#### Get Signature

> **get** **notes**(): readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:181](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L181)

Optional categorized notes

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Optional categorized notes

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`notes`](../interfaces/IMold.md#notes)

***

### productNumber

#### Get Signature

> **get** **productNumber**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:118](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L118)

Product number from the manufacturer

##### Returns

`string`

Product number from the manufacturer

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`productNumber`](../interfaces/IMold.md#productnumber)

***

### related

#### Get Signature

> **get** **related**(): readonly [`MoldId`](../../../../type-aliases/MoldId.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:174](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L174)

Optional related molds (cross-catalog via composite IDs)

##### Returns

readonly [`MoldId`](../../../../type-aliases/MoldId.md)[] \| `undefined`

Optional related molds (cross-catalog via composite IDs)

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`related`](../interfaces/IMold.md#related)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:170](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L170)

Optional tags

##### Returns

readonly `string`[] \| `undefined`

Optional tags

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`tags`](../interfaces/IMold.md#tags)

***

### totalCapacity

#### Get Signature

> **get** **totalCapacity**(): [`Measurement`](../../../../type-aliases/Measurement.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:201](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L201)

Gets the total capacity of the mold (all cavities) in grams.
Returns undefined if cavityWeight is not defined.

##### Returns

[`Measurement`](../../../../type-aliases/Measurement.md) \| `undefined`

Gets the total capacity of the mold (all cavities) in grams.
Returns undefined if cavityWeight is not defined.

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`totalCapacity`](../interfaces/IMold.md#totalcapacity)

***

### urls

#### Get Signature

> **get** **urls**(): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:189](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L189)

Optional categorized URLs

##### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[] \| `undefined`

Optional categorized URLs

#### Implementation of

[`IMold`](../interfaces/IMold.md).[`urls`](../interfaces/IMold.md#urls)

## Methods

### create()

> `static` **create**(`context`, `id`, `mold`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Mold`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/molds/mold.ts:75](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/molds/mold.ts#L75)

Factory method for creating a Mold.

#### Parameters

##### context

[`IMoldContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context (reserved for future use)

##### id

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite mold ID

##### mold

[`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md)

The mold data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Mold`\>

Success with Mold
