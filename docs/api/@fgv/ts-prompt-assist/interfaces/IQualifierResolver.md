[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IQualifierResolver

# Interface: IQualifierResolver

Strategy for matching an [IPromptObservationQuery](IPromptObservationQuery.md)'s `qualifiers`
criteria against an observation record's `qualifierContext`. Injected on
[PromptObservationStore.create](../classes/PromptObservationStore.md#create) via
[IPromptObservationStoreCreateParams.qualifierResolver](IPromptObservationStoreCreateParams.md#property-qualifierresolver).

## Remarks

The store ships with a default [defaultStringEqualityQualifierResolver](../variables/defaultStringEqualityQualifierResolver.md)
that does naive string equality on the supplied (defined) axes. This is
intentionally a **narrower contract** than `PromptLibrary.resolve`'s
ts-res-driven candidate selection, which uses qualifier types (e.g. BCP47
language-tag similarity), priority ordering, and type-specific match
semantics: a record produced under `lang=fr-CA` will NOT be returned by a
`qualifiers: { lang: 'fr' }` query against the default resolver, even
though `PromptLibrary` would have considered them a match.

Production deployments needing ts-res-equivalent semantics inject their own
`IQualifierResolver` implementation (e.g. one wrapping ts-res's
`ValidatingSimpleContextQualifierProvider` + `ResourceResolver` match path).
The injection point is locked here so the future swap is a pure
implementation-of-interface change rather than an API surface change.

## Methods

### matches()

> **matches**(`recordContext`, `queryContext`): `boolean`

Returns `true` iff the record's `qualifierContext` satisfies the query's
`qualifiers` criteria under this resolver's matching semantics.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `recordContext` | [`IQualifierContext`](../type-aliases/IQualifierContext.md) | The qualifier context the record was resolved under. |
| `queryContext` | [`IQualifierContext`](../type-aliases/IQualifierContext.md) | The qualifier criteria from the consumer's query. |

#### Returns

`boolean`
