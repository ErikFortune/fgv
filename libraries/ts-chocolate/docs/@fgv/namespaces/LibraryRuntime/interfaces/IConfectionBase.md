[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IConfectionBase

# Interface: IConfectionBase\<TVersion, TEntity\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1031](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1031)

Base interface for all runtime confections.
Provides common properties and version navigation shared by all confection types.

This interface includes all properties from the data layer `IConfectionEntity`
plus runtime-specific additions:
- Composite identity (`id`, `collectionId`) for cross-source references
- Version navigation with typed versions
- Effective tags/urls (merged from base + version)
- Type narrowing methods for discriminated access
- Access to underlying entity data

## Extended by

- [`IMoldedBonBon`](IMoldedBonBon.md)
- [`IBarTruffle`](IBarTruffle.md)
- [`IRolledTruffle`](IRolledTruffle.md)

## Type Parameters

### TVersion

`TVersion` *extends* [`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md) = [`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md)

The specific version type for this confection

### TEntity

`TEntity` *extends* [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md) = [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)

The specific entity type for this confection

## Properties

### baseId

> `readonly` **baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1051](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1051)

The base confection ID within the source.

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1046](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1046)

The collection ID part of the composite ID.

***

### confectionType

> `readonly` **confectionType**: [`ConfectionType`](../../../../type-aliases/ConfectionType.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1056](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1056)

Confection type (discriminator)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1121](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1121)

Decorations from the golden version

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1062](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1062)

Optional description

***

### effectiveTags

> `readonly` **effectiveTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1097](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1097)

Gets effective tags for the golden version (base + version's additional tags).

***

### effectiveUrls

> `readonly` **effectiveUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1102](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1102)

Gets effective URLs for the golden version (base + version's additional URLs).

***

### entity

> `readonly` **entity**: `TEntity`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1155](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1155)

Gets the underlying confection entity data.

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IResolvedFillingSlot`](IResolvedFillingSlot.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1127](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1127)

Resolved filling slots from the golden version

***

### goldenVersion

> `readonly` **goldenVersion**: `TVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1078](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1078)

The golden (default) version - resolved.

***

### goldenVersionSpec

> `readonly` **goldenVersionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1071](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1071)

The ID of the golden (approved default) version

***

### id

> `readonly` **id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1041](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1041)

The composite confection ID (e.g., "common.dark-dome-bonbon").
Combines source and base ID for unique identification across sources.

***

### name

> `readonly` **name**: [`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1059](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1059)

Human-readable name

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1130](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1130)

Resolved procedures from the golden version

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1065](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1065)

Base tags for searching/filtering (version may add more)

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1068](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1068)

Base URLs (version may add more)

***

### versions

> `readonly` **versions**: readonly `TVersion`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1083](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1083)

All versions - resolved.

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1124](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1124)

Yield specification from the golden version

## Methods

### getEffectiveTags()

> **getEffectiveTags**(`version?`): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1108](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1108)

Gets effective tags for a specific version.

#### Parameters

##### version?

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The version to get tags for (defaults to golden version)

#### Returns

readonly `string`[]

***

### getEffectiveUrls()

> **getEffectiveUrls**(`version?`): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1114](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1114)

Gets effective URLs for a specific version.

#### Parameters

##### version?

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The version to get URLs for (defaults to golden version)

#### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TVersion`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1090](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1090)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TVersion`\>

Success with runtime version, or Failure if not found

***

### isBarTruffle()

> **isBarTruffle**(): `this is IBarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1144](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1144)

Returns true if this is a bar truffle confection.
When true, bar truffle-specific properties are available.

#### Returns

`this is IBarTruffle`

***

### isMoldedBonBon()

> **isMoldedBonBon**(): `this is IMoldedBonBon`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1138](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1138)

Returns true if this is a molded bonbon confection.
When true, molded bonbon-specific properties are available.

#### Returns

`this is IMoldedBonBon`

***

### isRolledTruffle()

> **isRolledTruffle**(): `this is IRolledTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1150](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1150)

Returns true if this is a rolled truffle confection.
When true, rolled truffle-specific properties are available.

#### Returns

`this is IRolledTruffle`
