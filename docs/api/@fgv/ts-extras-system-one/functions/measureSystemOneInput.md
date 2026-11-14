[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / measureSystemOneInput

# Function: measureSystemOneInput()

> **measureSystemOneInput**(`state`, `questions`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemOneInputMeasure`](../interfaces/ISystemOneInputMeasure.md)\>

Measures, for each question, what an upstream CLM server embeds: the state plus the separator
plus the instructions, and each candidate text separately.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `state` | [`EntryType`](../type-aliases/EntryType.md) | The state to be sent. |
| `questions` | [`Questions`](../interfaces/Questions.md) | The questions to be sent. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemOneInputMeasure`](../interfaces/ISystemOneInputMeasure.md)\>

The lengths the input bound compares against `maxChars`, or a failure naming why the
input could not be measured.

## Remarks

Lengths are UTF-16 code units, and the texts are not trimmed as CLM trims them, so both
over-measure. Characters are a proxy for tokens, not a guarantee: the ratio varies with the
content and with each backend's tokenizer. A structured state is measured by its JSON
serialization.

Input outside the declared types — a question with missing or mis-shaped `criteria`, a state
or entry that is not JSON (a cycle, a `bigint`, a `Map`, a `Date`, an `undefined`) — fails
`invalid-request` rather than throws, and the message never quotes the input.
