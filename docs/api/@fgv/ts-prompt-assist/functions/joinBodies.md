[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / joinBodies

# Function: joinBodies()

> **joinBodies**(`selected`, `policy`): `string`

Joins selected candidate bodies per the supplied join policy (or the
design-§10.2 defaults).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `selected` | readonly `object`[] |
| `policy` | [`IPromptJoinPolicy`](../interfaces/IPromptJoinPolicy.md) \| `undefined` |

## Returns

`string`

## Remarks

`trimTrailingWhitespace: true` strips all trailing whitespace (the
`\s+$` form) — including bare trailing spaces, not just YAML-block-
scalar trailing newlines. This matches the option's name; consumers
who need to preserve trailing whitespace (e.g. trailing newlines)
pass `trimTrailingWhitespace: false`.
