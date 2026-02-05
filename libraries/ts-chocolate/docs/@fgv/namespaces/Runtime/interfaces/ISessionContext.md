[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Runtime](../README.md) / ISessionContext

# Interface: ISessionContext

Defined in: [ts-chocolate/src/packlets/runtime/model.ts:53](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/model.ts#L53)

Context interface for session creation.
Extends IConfectionContext with the ability to create filling editing sessions.

This interface is used by confection editing sessions to manage filling scaling.

## Properties

### confections

> `readonly` **confections**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`ConfectionId`](../../../../type-aliases/ConfectionId.md), [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md), [`IConfectionBase`](../../LibraryRuntime/interfaces/IConfectionBase.md)\<[`AnyConfectionVersion`](../../LibraryRuntime/type-aliases/AnyConfectionVersion.md), [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)\>, `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1554](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1554)

Materialized library of runtime confections.
Used for parent navigation from versions.

#### Inherited from

`IConfectionContext.confections`

***

### fillings

> `readonly` **fillings**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`FillingId`](../../../../type-aliases/FillingId.md), [`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md), [`IFillingRecipe`](../../LibraryRuntime/interfaces/IFillingRecipe.md), [`IFillingRecipeQuerySpec`](../../LibraryRuntime/namespaces/Indexers/interfaces/IFillingRecipeQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:869](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L869)

Map of all fillings, keyed by composite ID.

#### Inherited from

`IConfectionContext.fillings`

***

### ingredients

> `readonly` **ingredients**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`IngredientId`](../../../../type-aliases/IngredientId.md), [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md), [`IIngredient`](../../LibraryRuntime/interfaces/IIngredient.md)\<[`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)\>, [`IIngredientQuerySpec`](../../LibraryRuntime/namespaces/Indexers/interfaces/IIngredientQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:862](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L862)

Map of all ingredients, keyed by composite ID.

#### Inherited from

`IConfectionContext.ingredients`

***

### molds

> `readonly` **molds**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md), [`IMold`](../../LibraryRuntime/interfaces/IMold.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1548](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1548)

Materialized library of runtime molds.
Used for resolving mold references.

#### Inherited from

`IConfectionContext.molds`

***

### procedures

> `readonly` **procedures**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`ProcedureId`](../../../../type-aliases/ProcedureId.md), [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md), [`IProcedure`](../../LibraryRuntime/interfaces/IProcedure.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:876](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L876)

Map of all procedures, keyed by composite ID.

#### Inherited from

`IConfectionContext.procedures`

## Methods

### createFillingSession()

> **createFillingSession**(`filling`, `targetWeight`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](../namespaces/Session/classes/EditingSession.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/model.ts:61](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/model.ts#L61)

Creates an editing session for a filling recipe at a target weight.
Used by confection sessions to manage filling scaling.

#### Parameters

##### filling

[`IFillingRecipe`](../../LibraryRuntime/interfaces/IFillingRecipe.md)

The runtime filling recipe to create a session for

##### targetWeight

[`Measurement`](../../../../type-aliases/Measurement.md)

Target weight for the filling in grams

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](../namespaces/Session/classes/EditingSession.md)\>

Success with EditingSession, or Failure if creation fails
