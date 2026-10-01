# ts-extras-mcp: keep resource links, structuredContent and media in tool results

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#675](https://github.com/ErikFortune/personaility/issues/675) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:09Z. No comments.
- **Long form:** [`ASK-2026-09-29-ts-extras-mcp-hub-readiness.md` § M5](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md) on branch `design/mcp-tools`.

## The request, in their terms

> "keep today's text result as it is, and add a structured version alongside it. It would carry resource links, embedded resources, media and `structuredContent`, all of which are currently reduced to `[<type> block]` or dropped."

Note problem: "`_projectContent` (`operations.ts:96-105`) reduces every non-text block to `[<type> block]` and discards `structuredContent`."

Proposed shape (note): "Keep today's `content: string` and add a structured projection beside it — e.g. `blocks: ReadonlyArray<…>` with `resource_link` → `{uri, name, mimeType}`, embedded text resources → text, images/audio → `{mimeType, data}` (or size + type only, at the consumer's option), and `structuredContent?: JsonValue` when present."

Evidence (note): "[spike] `get-resource-links` → `[resource_link block]` ×2 (the URIs are gone, so the model cannot follow a link it was handed); `get-resource-reference` → `[resource block]` (embedded text resource lost); `get-tiny-image` → `[image block]`; `get-structured-content` survives only because the server also emits a text copy."

## Stated motivation

> "tools return text only, so servers that answer searches with links give prose-only answers."

## Stated constraints or acceptance

- Issue: "keep today's text result as it is" (additive).
- Note, minimum bar: > "At minimum, a `resource_link` should project to a line carrying its URI rather than to a placeholder."
- Requester-stated priority: "**P2.** It blocks MCP plan P5 (rich results)."
- Note "not asking for": "**Result-size caps.** We cap at our tool boundary; the package returning the full text is fine."
- Verified against `@fgv/ts-extras-mcp` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-extras-mcp`.

## Stated dependencies

None stated.

## Observations (intake agent's, not the requester's)

- None.
