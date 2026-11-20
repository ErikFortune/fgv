[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ScoreOf

# Type Alias: ScoreOf\<T\>

> **ScoreOf**\<`T`\> = `number` *extends* `T`\[`"length"`\] ? `number` : `Extract`\<keyof `T`, `` `${number}` ``\>

Score keys inferred from the rubric; a fixed-length tuple yields its indices, otherwise `number`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`ScoreCriteria`](ScoreCriteria.md) |
