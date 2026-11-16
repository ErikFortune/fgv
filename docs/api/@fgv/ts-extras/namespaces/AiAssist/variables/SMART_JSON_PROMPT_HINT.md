[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / SMART\_JSON\_PROMPT\_HINT

# Variable: SMART\_JSON\_PROMPT\_HINT

> `const` **SMART\_JSON\_PROMPT\_HINT**: `string`

Default system-prompt suffix appended when [AiAssist.IGenerateJsonCompletionParams.promptHint](../interfaces/IGenerateJsonCompletionParams.md#property-prompthint)
is `'smart'` (the default). Designed to discourage code fences and prose in
the model's response while still tolerating them via the read-side extractor.
