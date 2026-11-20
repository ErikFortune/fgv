# ts-json-base: `fromJson` — resolve local `$ref`/`$defs`

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#681](https://github.com/ErikFortune/personaility/issues/681) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:37Z. No comments.
- **Long form:** [`ASK-2026-09-29-json-schema-fromjson-mcp-subset.md` § J3](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-json-schema-fromjson-mcp-subset.md) on branch `design/mcp-tools`.

## The request, in their terms

> "resolve local (`#/…`) `$ref`/`$defs` references by inlining them, with a bound on depth and cycles; remote refs stay rejected. pydantic emits nested models in exactly this shape. fgv already lists this as its headline next step for `fromJson`; this issue records that MCP schemas need it."

## Stated motivation

> "tools that take nested models are skipped." (stated as the interim)

Note: "pydantic emits nested models as `$defs` + `$ref: '#/$defs/X'`; forbidden (`:34-44`)."

## Stated constraints or acceptance

- > "with a bound on depth and cycles; remote refs stay rejected."
- Requester-stated priority: "**P2.** It blocks nothing."
- Verified against `@fgv/ts-json-base` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-json-base` `JsonSchema.fromJson`.

## Stated dependencies

None stated.

## Observations (intake agent's, not the requester's)

- Confirmed: fgv `docs/FUTURE.md:402` names "`$ref`/`$defs` resolution and `pattern` passthrough" as "the highest-value additions" of the "Headline follow-on lever — additively widen `JsonSchema.fromJson`'s supported subset".
