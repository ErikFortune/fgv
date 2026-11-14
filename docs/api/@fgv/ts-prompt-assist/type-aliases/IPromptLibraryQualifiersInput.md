[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptLibraryQualifiersInput

# Type Alias: IPromptLibraryQualifiersInput\<TQualifierNames\>

> **IPromptLibraryQualifiersInput**\<`TQualifierNames`\> = [`Qualifiers.IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| `ReadonlyArray`\<`TQualifierNames` \| [`Qualifiers.IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) & `object`\>

Shape of the `qualifiers` field on [IPromptLibraryCreateParams](../interfaces/IPromptLibraryCreateParams.md).
Accepts either a pre-built ts-res `IReadOnlyQualifierCollector` (when
the consumer already maintains a ts-res qualifier set) or a mixed
array of bare axis-name strings and / or `IQualifierDecl`s (the
library builds the collector internally via ts-res's
`Qualifiers.QualifierCollector.create`, which synthesizes
`LiteralQualifierType`s for bare strings).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Remarks

Parameterized by `TQualifierNames extends string`, the qualifier-axis
string-literal union the consumer wants to enforce. On the decl-array
path, `TQualifierNames` is inferred from the array element types by
the static `PromptLibrary.create` factory's first overload — bare-
string elements contribute their string-literal type directly;
`IQualifierDecl` elements contribute their `name` literal. On the
pre-built-collector path the collector type does not expose its axis-
name union at the type level, so `TQualifierNames` falls back to
`string` unless the consumer specifies it explicitly.

Extracted as a named type so the union has a single TSDoc-attach
point and consumers writing typed `IPromptLibraryCreateParams`
literals can reference the qualifiers shape directly.
