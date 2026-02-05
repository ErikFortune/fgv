[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IProcedureRenderContext

# Interface: IProcedureRenderContext

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:72](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L72)

Context for rendering a procedure with full library access.

Unlike the data-layer IProcedureRenderContext (which uses `unknown` for library),
this interface has properly typed library access for task resolution.

## Properties

### context

> `readonly` **context**: [`IProcedureContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:77](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L77)

The procedure context for task resolution.
This provides type-safe access to tasks, unlike the data-layer's `unknown` library.

***

### mold?

> `readonly` `optional` **mold**: [`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:87](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L87)

Optional mold being used for this recipe

***

### recipe

> `readonly` **recipe**: [`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:82](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L82)

The specific produced filling this procedure is being rendered for
