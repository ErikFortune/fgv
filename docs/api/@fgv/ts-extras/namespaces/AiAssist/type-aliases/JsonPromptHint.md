[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / JsonPromptHint

# Type Alias: JsonPromptHint

> **JsonPromptHint** = `"smart"` \| `"none"` \| `string` & `object`

Controls the optional system-prompt augmentation applied by
[AiAssist.generateJsonCompletion](../functions/generateJsonCompletion.md).

- `'smart'` (default): append [AiAssist.SMART\_JSON\_PROMPT\_HINT](../variables/SMART_JSON_PROMPT_HINT.md).
- `'none'`: do not modify the prompt.
- A string: append the supplied text verbatim.

## Remarks

The `string & {}` branch is the standard TypeScript trick that prevents
the literal members from being widened away — callers still get
autocomplete for `'smart'` and `'none'` while accepting any string.
