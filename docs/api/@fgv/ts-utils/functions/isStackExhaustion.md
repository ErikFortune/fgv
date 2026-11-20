[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_isStackExhaustion

# Function: \_isStackExhaustion()

> **\_isStackExhaustion**(`err`): `boolean`

**`Internal`**

Whether a caught value is stack exhaustion, which the boundary re-throws below the outermost level
so that it fails once instead of at every level.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |

## Returns

`boolean`

## Remarks

Yes for SpiderMonkey's `InternalError`, and for a `RangeError` whose message reads as stack
exhaustion: V8 and JavaScriptCore say "Maximum call stack size exceeded", SpiderMonkey "too much
recursion". Both are judged by `name`, which also holds for an error from another realm, and the
message by plain substring: a regular expression is compiled on first use, and V8 aborts the
process when it compiles one with the stack nearly exhausted, which is exactly when this runs. The
message is matched because a `RangeError` alone is not evidence: an invalid date
or array length raises one too, and that is an ordinary error the nearest boundary must handle. If
the check itself throws — the stack is too close to its limit to run it, or the thrown value is a
Proxy whose traps throw — the answer is yes, because propagating to the outermost boundary is the
direction that cannot multiply work.
