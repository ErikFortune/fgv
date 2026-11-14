[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / InferQualifiersFromCreate

# Type Alias: InferQualifiersFromCreate\<Q\>

> **InferQualifiersFromCreate**\<`Q`\> = `Q` *extends* `ReadonlyArray`\<`string` \| [`Qualifiers.IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\> ? [`InferQualifiers`](InferQualifiers.md)\<`Q`\> : `string`

Type-level helper used by `PromptLibrary.create`'s decl-array
inference branch. When `Q` is a `ReadonlyArray<string | IQualifierDecl>`,
derives the `TQualifierNames` union via [InferQualifiers](InferQualifiers.md); when `Q` is a
pre-built `IReadOnlyQualifierCollector`, the collector type does not
expose its axis-name union at the type level, so `TQualifierNames` defaults to
`string`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-q"></a> `Q` *extends* [`Qualifiers.IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| `ReadonlyArray`\<`string` \| [`Qualifiers.IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\> |
