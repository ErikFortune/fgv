[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / SystemOneAnswerResult

# Type Alias: SystemOneAnswerResult\<Q\>

> **SystemOneAnswerResult**\<`Q`\> = `{ readonly [K in keyof SystemOneResult<Q>]: K extends "answers" ? { readonly [A in keyof SystemOneResult<Q>["answers"]]: WithoutConfidence<SystemOneResult<Q>["answers"][A]> } : SystemOneResult<Q>[K] }`

The SDK's `SystemOneResult` for questions `Q`, with `confidence` removed from every `choice`
and `score` answer.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-q"></a> `Q` *extends* [`Questions`](../interfaces/Questions.md) |
