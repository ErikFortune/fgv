# ts-json-base: carry constraint keywords through `toJson()`

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#682](https://github.com/ErikFortune/personaility/issues/682) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:42Z. No comments.
- **Long form:** [`ASK-2026-09-29-json-schema-fromjson-mcp-subset.md` § J4](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-json-schema-fromjson-mcp-subset.md) on branch `design/mcp-tools`.

## The request, in their terms

> "`fromJson` accepts these keywords but `toJson()` drops them, so the model never sees them:
> - `minimum`, `maximum`, `exclusiveMinimum`
> - `minLength`, `maxLength`
> - `format`, `const`, `default`, `examples`, `title`
>
> Carry them through to `toJson()` wherever the provider wire formats accept them. Where a provider's strict mode forbids a keyword, fold it into the property's description instead."

Example from the note: "The model is shown `{"n":{"type":"number"}}` for a server that declared `{type:number, minimum:1, maximum:10, default:3}`, so it cannot know the range; the server then rejects the call and the round is wasted."

## Stated motivation

> "the model guesses ranges and formats. A wrong guess comes back as a validation error from the server, which costs an extra round trip."

## Stated constraints or acceptance

- Note: "(validating them is optional — the server validates too)".
- Note: "You know the per-provider constraints; we only need the model to see what the server declared."
- Requester-stated priority: "**P2.** It blocks nothing."
- Verified against `@fgv/ts-json-base` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-json-base` `JsonSchema` (`toJson()`); provider-specific folding plausibly involves `@fgv/ts-extras` ai-assist — unclear from the text.

## Stated dependencies

None stated.

## Observations (intake agent's, not the requester's)

- `fromJson.ts`'s header comment (`integration/agent-tasks-v1` @ `2a95fbb2`) states "Pure annotations (`title`, `default`, `examples`, draft-07 `format`) carry no validation semantics and are intentionally ignored". This covers four of the ten keywords the request names.
