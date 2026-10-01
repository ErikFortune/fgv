# ts-json-base: `fromJson` — numeric enums, pattern, record, any

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#683](https://github.com/ErikFortune/personaility/issues/683) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:47Z. No comments.
- **Long form:** [`ASK-2026-09-29-json-schema-fromjson-mcp-subset.md` § J5](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-json-schema-fromjson-mcp-subset.md) on branch `design/mcp-tools`.

## The request, in their terms

> "accept smaller shapes seen in real MCP tool schemas, wherever the existing subset can represent them:
> - number and integer `enum` (pydantic `Literal[1, 2]`)
> - `pattern` (already in fgv's FUTURE)
> - `additionalProperties` given as a schema (zod `z.record(z.string())`); the fully open case is the separate J1 ask
> - `{}` with no `type` (pydantic `Any`)"

Note adds the observed error for numeric enums: "`Field enum: Not a string: 1`", and the zod spellings `z.union([z.literal(1), …])` and `.regex()`.

## Stated motivation

> "tools that use these shapes are skipped, and the approval screen reports them." (stated as the interim)

## Stated constraints or acceptance

- > "wherever the existing subset can represent them"
- > "fgv decides which of these to support."
- Requester-stated priority: "**P3.** It blocks nothing."
- Verified against `@fgv/ts-json-base` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-json-base` `JsonSchema.fromJson`.

## Stated dependencies

- Schema-valued `additionalProperties` is stated to overlap J1 ([#679](https://github.com/ErikFortune/personaility/issues/679)): "the fully open case is the separate J1 ask".

## Observations (intake agent's, not the requester's)

- This is one issue bundling four sub-shapes; captured as one file because it is one request in the source. `pattern` is in fgv `docs/FUTURE.md:402` and in `FORBIDDEN_KEYWORDS` in `fromJson.ts`.
