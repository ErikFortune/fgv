[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptSectionMeasure

# Type Alias: PromptSectionMeasure

> **PromptSectionMeasure** = (`text`) => `number`

How a resolved prompt's text is measured, when the default character count is not the unit the
caller cares about.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

`number`

## Remarks

**Segmentation is the library's job; measurement is the caller's.** A prompt budget is
denominated in *tokens*, and `ts-prompt-assist` cannot count those truthfully — tokenization is
model-specific, so a bundled tokenizer would be confidently wrong for every model it was not
built for. Characters are always reported because they are exact and free; supply this to get a
second number in a unit that means something to you.
