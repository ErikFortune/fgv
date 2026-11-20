[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / foldedKeywordsText

# Function: foldedKeywordsText()

> **foldedKeywordsText**(`folded`): `string`

The text that states folded keywords in a description: the validating keywords as one
`Constraints:` sentence, then one sentence per folded annotation.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `folded` | readonly (readonly \[[`SchemaFoldedKeyword`](../type-aliases/SchemaFoldedKeyword.md), [`JsonValue`](../../../type-aliases/JsonValue.md)\])[] | The folded keywords and their values. |

## Returns

`string`

The text.

## Remarks

- Validating keywords: `Constraints: minimum 1; maximum 10.` — each keyword name, a space and
  its value as JSON, joined by `"; "`. A folded non-string `enum` is one of them, and comes
  first: `Constraints: enum [1,2].`
- Annotations, each its own sentence so none reads as a constraint: `Format: email.`,
  `Title: Count.` (a string value written as it is), `Default: null.`, `Examples: ["a","b"].`
  (other values as JSON).

Both follow `enum` then `schemaConstraintKeywords` order whatever order the keys arrived in, and the two
parts are joined by one space. Fixed wording and order make the output byte-stable for prompt
caching. Returns `''` for nothing folded.
