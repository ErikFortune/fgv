[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskEnvironmentParams

# Interface: ITaskEnvironmentParams

The three ambient capabilities a host injects. The library constructs none of them.

## Remarks

`clock` returns epoch milliseconds; `newId` is Result-valued because identity
generation is fallible at the boundary (an exhausted or unavailable crypto source is
a failure, not an exception). Nothing here opens a repository or registers global
state — importing this library has no side effects.

## Extended by

- [`ITaskEnvironment`](ITaskEnvironment.md)
- [`ITaskEnvironmentCreateParams`](ITaskEnvironmentCreateParams.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-clock"></a> `clock` | `readonly` | () => `number` |
| <a id="property-logger"></a> `logger` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) |
| <a id="property-newid"></a> `newId` | `readonly` | () => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\> |
