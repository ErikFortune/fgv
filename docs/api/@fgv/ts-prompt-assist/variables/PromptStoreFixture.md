[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptStoreFixture

# Variable: PromptStoreFixture

> `const` **PromptStoreFixture**: `object`

Test fixture helper that builds an `InMemoryFileTree` containing the
supplied records / bindings / qualifier config and returns a
`FileTreePromptStore` backed by it. Per design §5.2: no standalone
`InMemoryPromptStore`; tests round-trip through the same YAML schema
the FsTree adapter would.

## Type Declaration

| Name | Type |
| ------ | ------ |
| `build()` | (`seed`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPromptStore`](../interfaces/IPromptStore.md)\>\> |

## Remarks

Generic over `TQualifierNames extends string` (B-3). Inferred from
the supplied seed when the seed's `IPromptStoreFixtureSeed<...>`
type parameter is narrowed at the call site — e.g.
`PromptStoreFixture.build<'tone'>(seed)` or via an annotated
`const seed: IPromptStoreFixtureSeed<'tone'> = { ... }`. The
resulting store has the same runtime shape regardless of
`TQualifierNames`; the parameter drives compile-time narrowing of
candidate `conditions` keys. Convert-time enforcement is achieved
by ALSO supplying `seed.qualifierNameConverter` — the build passes
the Converter through to `FileTreePromptStore.create`, so a
round-tripped YAML with a typo'd axis name fails at load time.
