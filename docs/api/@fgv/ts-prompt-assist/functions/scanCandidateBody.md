[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / scanCandidateBody

# Function: scanCandidateBody()

> **scanCandidateBody**(`body`, `promptId`, `candidateIndex`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Scans a candidate body for double-brace `\{\{name\}\}` and ampersand-unescape
`\{\{&name\}\}` Mustache tokens. The locked authoring rule (design §6) is
that LLM-prompt bodies use only triple-brace `\{\{\{name\}\}\}` tokens — the
library renders with `escape: 'none'`, so the double-brace and ampersand
forms semantically collapse with the triple-brace form but are rejected at
load time to keep author intent explicit.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `body` | `string` | Candidate body to scan. |
| `promptId` | [`PromptId`](../type-aliases/PromptId.md) | Prompt id for error context. |
| `candidateIndex` | `number` | Index into the record's candidates array, for error context. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Success on a clean body; Failure with prompt-id and offending token in the message.
