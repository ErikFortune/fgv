[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / WithoutConfidence

# Type Alias: WithoutConfidence\<T\>

> **WithoutConfidence**\<`T`\> = `T` *extends* [`ChoiceResponse`](../interfaces/ChoiceResponse.md)\<infer C\> ? `Omit`\<[`ChoiceResponse`](../interfaces/ChoiceResponse.md)\<`C`\>, `"confidence"`\> : `T` *extends* [`ScoreResponse`](../interfaces/ScoreResponse.md)\<infer S\> ? `Omit`\<[`ScoreResponse`](../interfaces/ScoreResponse.md)\<`S`\>, `"confidence"`\> : `T`

An SDK answer type with `confidence` removed, which every backend defines differently.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
