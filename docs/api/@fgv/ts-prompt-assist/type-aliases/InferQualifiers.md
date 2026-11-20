[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / InferQualifiers

# Type Alias: InferQualifiers\<Q\>

> **InferQualifiers**\<`Q`\> = `Q`\[`number`\] *extends* infer E ? `E` *extends* `string` ? `E` : `E` *extends* `object` ? `N` *extends* `string` ? `N` : `never` : `never` : `never`

Type-level helper: derive the `TQualifierNames` string union from a mixed
`(string | IQualifierDecl)[]` literal-typed array. Bare-string
elements contribute their own string-literal type; decl elements
contribute their `.name` literal. Falls back to `string` when the
array element type is unconstrained.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-q"></a> `Q` *extends* `ReadonlyArray`\<`string` \| [`Qualifiers.IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\> |
