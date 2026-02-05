[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IValidatingLibraryParams

# Interface: IValidatingLibraryParams\<TK, TV, TSpec, TOrchEntity\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:80](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L80)

Parameters for ValidatingLibrary construction.

## Extends

- [`IValidatingResultMapConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

## Type Parameters

### TK

`TK` *extends* `string`

### TV

`TV`

### TSpec

`TSpec`

### TOrchEntity

`TOrchEntity` = `TV`

## Properties

### converters

> **converters**: [`KeyValueConverters`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

Defined in: ts-utils/dist/ts-utils.d.ts:3504

#### Inherited from

`Collections.IValidatingResultMapConstructorParams.converters`

***

### entries?

> `optional` **entries**: `Iterable`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `unknown`\>, `any`, `any`\>

Defined in: ts-utils/dist/ts-utils.d.ts:3503

#### Inherited from

`Collections.IValidatingResultMapConstructorParams.entries`

***

### orchestrator

> **orchestrator**: [`IFindOrchestrator`](IFindOrchestrator.md)\<`TOrchEntity`, `TSpec`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:87](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L87)

The orchestrator that provides find functionality.
The orchestrator's entity type (TOrchEntity) may be a supertype of TV
(e.g., IIngredient when TV is AnyIngredient).
