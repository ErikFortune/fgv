[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / checkForAiErrorObject

# Function: checkForAiErrorObject()

> **checkForAiErrorObject**(`parsed`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`never`\> \| `undefined`

Checks whether a parsed AI response is an error object (with an "error" field)
rather than a valid entity. AI prompts instruct the model to return
`{ "error": "...", "term": "..." }` when it cannot confidently generate the entity.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parsed` | `unknown` | The parsed JSON from the AI response |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`never`\> \| `undefined`

A failure Result with the error message if it's an error object, or undefined if not
