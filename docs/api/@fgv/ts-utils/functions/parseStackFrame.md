[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_parseStackFrame

# Function: \_parseStackFrame()

> **\_parseStackFrame**(`line`): [`_IShouldNotFailFrame`](../interfaces/IShouldNotFailFrame.md)

**`Internal`**

Parses a single stack-trace line in either V8 or WebKit format.

V8: `    at <fn> (<file>:<line>:<col>)` or `    at <file>:<line>:<col>`
WebKit: `<fn>@<file>:<line>:<col>` or `@<file>:<line>:<col>`

## Parameters

| Parameter | Type |
| ------ | ------ |
| `line` | `string` |

## Returns

[`_IShouldNotFailFrame`](../interfaces/IShouldNotFailFrame.md)
