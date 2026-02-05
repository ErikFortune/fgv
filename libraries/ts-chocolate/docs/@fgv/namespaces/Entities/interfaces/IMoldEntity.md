[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IMoldEntity

# Interface: IMoldEntity

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:79](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L79)

Represents a chocolate mold

## Properties

### baseId

> `readonly` **baseId**: [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:83](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L83)

Base mold identifier (unique within source)

***

### cavities

> `readonly` **cavities**: [`ICavities`](../type-aliases/ICavities.md)

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:103](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L103)

Cavities in the mold

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:98](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L98)

Human-readable description of the mold shape

***

### format

> `readonly` **format**: [`MoldFormat`](../../../../type-aliases/MoldFormat.md)

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:108](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L108)

Mold format/series (determines frame dimensions)

***

### manufacturer

> `readonly` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:88](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L88)

Manufacturer of the mold

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:123](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L123)

Optional categorized notes about the mold

***

### productNumber

> `readonly` **productNumber**: `string`

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:93](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L93)

Product number from the manufacturer

***

### related?

> `readonly` `optional` **related**: readonly [`MoldId`](../../../../type-aliases/MoldId.md)[]

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:118](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L118)

Related molds (e.g., different sizes of the same mold)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:113](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L113)

Optional tags for categorization and search

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/molds/model.ts:128](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/molds/model.ts#L128)

Optional categorized URLs for external resources (manufacturer page, purchase link, etc.)
