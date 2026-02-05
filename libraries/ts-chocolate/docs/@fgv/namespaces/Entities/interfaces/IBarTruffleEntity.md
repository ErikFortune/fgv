[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IBarTruffleEntity

# Interface: IBarTruffleEntity

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:376](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L376)

Bar truffle confection
Ganache slab cut into squares and enrobed

## Extends

- [`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md)

## Properties

### baseId

> `readonly` **baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:338](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L338)

Base identifier within source (no dots)

#### Inherited from

[`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md).[`baseId`](../namespaces/Confections/interfaces/IConfectionEntityBase.md#baseid)

***

### confectionType

> `readonly` **confectionType**: `"bar-truffle"`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:378](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L378)

Type discriminator

#### Overrides

[`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md).[`confectionType`](../namespaces/Confections/interfaces/IConfectionEntityBase.md#confectiontype)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:344](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L344)

Optional description

#### Inherited from

[`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md).[`description`](../namespaces/Confections/interfaces/IConfectionEntityBase.md#description)

***

### goldenVersionSpec

> `readonly` **goldenVersionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:350](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L350)

The ID of the golden (approved default) version

#### Inherited from

[`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md).[`goldenVersionSpec`](../namespaces/Confections/interfaces/IConfectionEntityBase.md#goldenversionspec)

***

### name

> `readonly` **name**: [`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:342](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L342)

Human-readable name

#### Inherited from

[`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md).[`name`](../namespaces/Confections/interfaces/IConfectionEntityBase.md#name)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:346](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L346)

Optional tags for searching/filtering

#### Inherited from

[`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md).[`tags`](../namespaces/Confections/interfaces/IConfectionEntityBase.md#tags)

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:348](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L348)

Optional categorized URLs for external resources (tutorials, videos, etc.)

#### Inherited from

[`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md).[`urls`](../namespaces/Confections/interfaces/IConfectionEntityBase.md#urls)

***

### versions

> `readonly` **versions**: readonly [`IBarTruffleVersionEntity`](IBarTruffleVersionEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:380](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L380)

Version history with bar truffle specific details

#### Overrides

[`IConfectionEntityBase`](../namespaces/Confections/interfaces/IConfectionEntityBase.md).[`versions`](../namespaces/Confections/interfaces/IConfectionEntityBase.md#versions)
