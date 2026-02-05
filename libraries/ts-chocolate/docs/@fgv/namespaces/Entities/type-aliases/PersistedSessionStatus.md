[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / PersistedSessionStatus

# Type Alias: PersistedSessionStatus

> **PersistedSessionStatus** = `"planning"` \| `"active"` \| `"committing"` \| `"committed"` \| `"abandoned"`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:85](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L85)

Persisted session lifecycle state.
- `planning`: Session is being planned but not actively editing
- `active`: Session is actively being edited
- `committing`: Session is in the process of being committed
- `committed`: Session has been committed to a journal entry
- `abandoned`: Session was explicitly abandoned
