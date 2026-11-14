[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_normalizeShouldNotFailFnName

# Function: \_normalizeShouldNotFailFnName()

> **\_normalizeShouldNotFailFnName**(`fn`): `string` \| `undefined`

**`Internal`**

Normalizes a function name from a stack frame, returning `undefined` when
the name is empty or one of the well-known anonymous-IIFE noise patterns
(typically emitted by V8 for module-top-level code).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | `string` \| `undefined` |

## Returns

`string` \| `undefined`
