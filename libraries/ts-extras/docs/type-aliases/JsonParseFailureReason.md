[Home](../README.md) > JsonParseFailureReason

# Type Alias: JsonParseFailureReason

Typed reason a JSON-shaped LLM response failed to parse, so a caller can
branch on the failure class instead of regex-matching the engine's
`JSON.parse` message (whose wording varies across V8 / Node versions).

Every classified arm describes a fault at an **object property-name
position** — the position an LLM most often gets wrong, and the one whose
repair strategy differs most by case:

- `'unquoted-property-name'`: a bare identifier where a quoted name belongs
  (`{ key: 1 }`). `token` is the identifier run, `offset` its first
  character. Identifier recognition is ASCII-only, so a non-ASCII bare name
  (`{ ключ: 1 }`) reports `'unknown'` rather than being named.
- `'single-quoted-property-name'`: a single-quoted name (`{ 'key': 1 }`).
  `token` is the quoted literal (or just `'` if it never closes), `offset`
  the opening quote.
- `'unterminated-property-name'`: a name whose closing `"` is missing, and
  whose body swallowed structural text (`{ "key: 1 }`). `token` is the
  unterminated fragment, `offset` the opening quote.
- `'elided-member'`: a `,` where a member is expected — a leading or doubled
  comma in an object (`{ , "a": 1 }`, `{ "a":1, , "b":2 }`) or an array
  (`[1, , 2]`). `token` is `','`, `offset` its position.
- `'unknown'`: the catch-all. The scan reached the end of the text, or hit a
  fault it cannot name with confidence, and reports nothing rather than
  guessing. Truncated responses, missing colons, trailing commas, bad number
  literals, and anything else not listed above land here.

`offset` is a 0-based index into the `text` passed to
AiAssist.classifyJsonParseFailure, not into the extracted substring.

## Type

```typescript
type JsonParseFailureReason = { kind: "unquoted-property-name"; token: string; offset: number } | { kind: "single-quoted-property-name"; token: string; offset: number } | { kind: "unterminated-property-name"; token: string; offset: number } | { kind: "elided-member"; token: string; offset: number } | { kind: "unknown" }
```
