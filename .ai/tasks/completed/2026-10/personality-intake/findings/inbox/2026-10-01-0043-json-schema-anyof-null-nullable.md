# ts-json-base: `fromJson` — accept `anyOf`/`oneOf` `[T, null]` as nullable

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#680](https://github.com/ErikFortune/personaility/issues/680) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:33Z. No comments.
- **Long form:** [`ASK-2026-09-29-json-schema-fromjson-mcp-subset.md` § J2](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-json-schema-fromjson-mcp-subset.md) on branch `design/mcp-tools`.

## The request, in their terms

> "accept an `anyOf`/`oneOf` that holds exactly one supported schema plus `{type:'null'}`, normalized to the existing nullable form."

Note: "`anyOf` is forbidden outright (`fromJson.ts:34-44`). pydantic v2 emits `{ anyOf: [{type:'string'}, {type:'null'}], default: null }` for every `Optional[str] = None` … The subset already models nullability (`type: [T, 'null']` adapts); this is the same meaning in the other spelling."

## Stated motivation

> "pydantic v2 emits this shape for every `Optional[T] = None`, so almost any FastMCP tool with an optional parameter is skipped today."

## Stated constraints or acceptance

- > "General unions remain out of scope." (Note § J6: `anyOf` of two non-null types is "**not requested**" — "skipping is the right behaviour.")
- Requester-stated priority: "**P1.** It doesn't block the MCP plan's first phases, but it decides whether FastMCP servers in general are usable."
- Interim: "those tools are skipped, and the server's approval screen reports them."
- Verified against `@fgv/ts-json-base` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-json-base` `JsonSchema.fromJson`.

## Stated dependencies

None stated.

## Observations (intake agent's, not the requester's)

- On `integration/agent-tasks-v1` @ `2a95fbb2`, `FORBIDDEN_KEYWORDS` in `libraries/ts-json-base/src/packlets/json-schema-builder/fromJson.ts` still lists `oneOf` and `anyOf`; the nullable form the request normalizes to (`type: [t, 'null']`) exists via `JsonSchema` `nullable` (LIBRARY_CAPABILITIES index).
