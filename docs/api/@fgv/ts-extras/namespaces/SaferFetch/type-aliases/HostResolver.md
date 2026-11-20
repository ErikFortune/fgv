[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / HostResolver

# Type Alias: HostResolver

> **HostResolver** = (`hostname`) => `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadonlyArray`\<`string`\>\>\>

Resolves a hostname to every address it names.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hostname` | `string` | The host to resolve, with no surrounding brackets. |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadonlyArray`\<`string`\>\>\>

## Remarks

Injectable so that the resolving half of an address guard is testable without a network — a
guard test that performs a real lookup fails in CI for reasons unrelated to the guard, and a
guard test that could reach `169.254.169.254` is worse than flaky.

An implementation must return a `Failure` rather than reject: `node:dns` rejects on
`ENOTFOUND`, `EAI_AGAIN` and friends, and an entry point documented to always return a
`Result` must not let that escape as a throw. [SaferFetch.nodeHostResolver](../variables/nodeHostResolver.md) converts.
