[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / formatValueForMessage

# Function: formatValueForMessage()

> **formatValueForMessage**(`value`, `options?`): `string`

Renders an arbitrary value as text for inclusion in a failure or diagnostic message. Never
throws.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to render. |
| `options?` | [`IFormatValueForMessageOptions`](../interfaces/IFormatValueForMessageOptions.md) | Optional [formatting options](../interfaces/IFormatValueForMessageOptions.md). |

## Returns

`string`

The rendered text.

## Remarks

**Compatibility:** the text is what `JSON.stringify(value, undefined, indent)` produces, cut to
`maxLength` with a trailing `…`, for every value `JSON.stringify` renders without throwing —
including its treatment of `undefined`, functions and symbols, `toJSON`, class instances, `Map`s,
typed arrays and boxed primitives. It departs from `JSON.stringify` only where `JSON.stringify`
would throw or produce nothing:
- a reference back to an object on the active ancestor path renders as `"[Circular]"`;
- a `BigInt` renders as `"123n"`;
- a value whose getter, Proxy trap or `toJSON` throws renders as `[Unreadable]`, in place;
- a top-level `undefined`, symbol or function renders as `undefined`, `Symbol(description)` or
  `[Function name]`.

**How.** It calls `JSON.stringify` with a replacer that makes the first two substitutions. If that
still throws, or the output is shown to exceed `maxLength`, a reimplementation of the same
serialization renders instead, containing every read and stopping once the bound is reached.

**What runs.** Like `JSON.stringify`, it invokes getters, Proxy traps and `toJSON`. When the first
attempt throws partway or is abandoned for length, the reimplementation walks the value again, so
a getter or `toJSON` can run twice; one with side effects can make the second walk differ from the
first. The [\`'string'\` style](../interfaces/IFormatValueForMessageOptions.md#property-style) invokes `toString` /
`Symbol.toPrimitive` instead.

**Cost.** Proportional to `maxLength`, plus any members `JSON.stringify` omits (an `undefined` or
function property), which take no output space and so are not bounded by it. A graph nested more
deeply than the stack allows, with `maxLength` lifted, renders as `[Unreadable]`.
