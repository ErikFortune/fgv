[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / MutabilitySpec

# Type Alias: MutabilitySpec

> **MutabilitySpec** = `boolean` \| `ReadonlyArray`\<`string`\> \| \{ `immutable`: `ReadonlyArray`\<`string`\>; \}

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:175](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L175)

Specifies which collections should be mutable.
- `true`: All collections are mutable.
- `false`: All collections are immutable.
- `ReadonlyArray<string>`: Only the specified collections are mutable, all others are immutable.
- `{ immutable: ReadonlyArray<string> }`: Only the specified collections are immutable, all others are mutable.
