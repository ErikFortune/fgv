[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ResultFor

# Type Alias: ResultFor\<T\>

> **ResultFor**\<`T`\> = `T` *extends* [`NoulQuestion`](../interfaces/NoulQuestion.md) ? [`NoulResponse`](../interfaces/NoulResponse.md) : `T` *extends* [`ScoreQuestion`](../interfaces/ScoreQuestion.md)\<infer S\> ? [`ScoreResponse`](../interfaces/ScoreResponse.md)\<`S`\> : `T` *extends* [`ChoiceQuestion`](../interfaces/ChoiceQuestion.md)\<infer E\> ? [`ChoiceResponse`](../interfaces/ChoiceResponse.md)\<`E`\> : `never`

The answer type for a question, preserving its criteria keys.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`Question`](Question.md) |
