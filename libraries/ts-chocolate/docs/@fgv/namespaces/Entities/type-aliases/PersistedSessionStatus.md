[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / PersistedSessionStatus

# Type Alias: PersistedSessionStatus

> **PersistedSessionStatus** = `"planning"` \| `"active"` \| `"committing"` \| `"committed"` \| `"abandoned"`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:85](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L85)

Persisted session lifecycle state.
- `planning`: Session is being planned but not actively editing
- `active`: Session is actively being edited
- `committing`: Session is in the process of being committed
- `committed`: Session has been committed to a journal entry
- `abandoned`: Session was explicitly abandoned
