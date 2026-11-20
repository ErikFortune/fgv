[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / normalizeSubstitutionEntry

# Function: normalizeSubstitutionEntry()

> **normalizeSubstitutionEntry**(`entry`): [`SlotBinding`](../type-aliases/SlotBinding.md)

Normalizes a single caller-supplied substitution entry (bare string or
`SlotBinding`) into a `SlotBinding`. Bare strings expand to
`\{ kind: 'literal', value, directive: 'prose' \}` per design §3.6.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | `string` \| [`SlotBinding`](../type-aliases/SlotBinding.md) |

## Returns

[`SlotBinding`](../type-aliases/SlotBinding.md)
