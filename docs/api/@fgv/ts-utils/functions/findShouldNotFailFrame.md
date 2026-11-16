[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_findShouldNotFailFrame

# Function: \_findShouldNotFailFrame()

> **\_findShouldNotFailFrame**(`stack`, `frameDepth`): [`_IShouldNotFailFrame`](../interfaces/IShouldNotFailFrame.md)

**`Internal`**

Finds the caller frame at the supplied depth in a stack string.

Filters out frames whose **parsed function name** contains `shouldNotFail`
(the file path is deliberately NOT inspected — consumer test files may
themselves be named after `shouldNotFail` and their frames must not be
filtered out). Covers both the V8 path — where `Error.captureStackTrace`
should have done this already but the extra filter is harmless — and the
WebKit fallback path where `captureStackTrace` is unavailable. `frameDepth`
is 1-indexed: `1` selects the immediate caller.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `stack` | `string` \| `undefined` |
| `frameDepth` | `number` |

## Returns

[`_IShouldNotFailFrame`](../interfaces/IShouldNotFailFrame.md)
