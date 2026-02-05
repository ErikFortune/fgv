[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Session](../README.md) / ISerializedEditingHistoryEntity

# Interface: ISerializedEditingHistoryEntity\<T\>

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:120](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L120)

Serialized undo/redo history for any editable entity.
Captures the full editing state for restoration.

## Type Parameters

### T

`T`

The type of the state being tracked

## Properties

### current

> `readonly` **current**: `T`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:122](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L122)

Current editing state

***

### original

> `readonly` **original**: `T`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:124](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L124)

Original state when session started (for change detection)

***

### redoStack

> `readonly` **redoStack**: readonly `T`[]

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:128](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L128)

Redo stack - states that were undone and can be reapplied

***

### undoStack

> `readonly` **undoStack**: readonly `T`[]

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:126](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L126)

Undo stack - states that can be restored
