[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IConfectionEntityBase

# Interface: IConfectionEntityBase

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:336](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L336)

Base confection interface - all confection types share these properties.
Contains stable identity and metadata; configuration details are in versions.

## Extended by

- [`IBarTruffleEntity`](../../../interfaces/IBarTruffleEntity.md)
- [`IMoldedBonBonEntity`](../../../interfaces/IMoldedBonBonEntity.md)
- [`IRolledTruffleEntity`](../../../interfaces/IRolledTruffleEntity.md)

## Properties

### baseId

> `readonly` **baseId**: [`BaseConfectionId`](../../../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:338](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L338)

Base identifier within source (no dots)

***

### confectionType

> `readonly` **confectionType**: [`ConfectionType`](../../../../../../type-aliases/ConfectionType.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:340](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L340)

Confection type (discriminator)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:344](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L344)

Optional description

***

### goldenVersionSpec

> `readonly` **goldenVersionSpec**: [`ConfectionVersionSpec`](../../../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:350](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L350)

The ID of the golden (approved default) version

***

### name

> `readonly` **name**: [`ConfectionName`](../../../../../../type-aliases/ConfectionName.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:342](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L342)

Human-readable name

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:346](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L346)

Optional tags for searching/filtering

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:348](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L348)

Optional categorized URLs for external resources (tutorials, videos, etc.)

***

### versions

> `readonly` **versions**: readonly [`AnyConfectionVersionEntity`](../../../type-aliases/AnyConfectionVersionEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:352](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L352)

Version history - contains type-specific configuration details
