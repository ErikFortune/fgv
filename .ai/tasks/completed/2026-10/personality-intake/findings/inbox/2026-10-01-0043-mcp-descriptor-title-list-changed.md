# ts-extras-mcp: descriptor title/outputSchema and tools list_changed

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#676](https://github.com/ErikFortune/personaility/issues/676) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:13Z. No comments.
- **Long form:** [`ASK-2026-09-29-ts-extras-mcp-hub-readiness.md` § M6](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md) on branch `design/mcp-tools`.

## The request, in their terms

Two parts (issue):

> "**Descriptor fields:** carry `title` and `outputSchema` on `IMcpToolDescriptor`."
>
> "**Tool-list changes:** accept an `onToolsChanged` callback that fires on `notifications/tools/list_changed`."

Note problem: "`IMcpToolDescriptor` drops `title`, `outputSchema` and `_meta`; the session cannot subscribe to `notifications/tools/list_changed`." Proposed shape: "Carry `title?` and `outputSchema?` (raw JSON) on the descriptor; accept an `onToolsChanged` callback on `connectMcpSession`."

Evidence (note): "The reference server advertises `tools.listChanged: true` and titles every tool; AWS Knowledge advertises `listChanged: false`."

## Stated motivation

Interim (issue):

> "The hub re-lists tools on every connect and on an operator refresh, and detects changes by fingerprint. A tool added mid-session stays unseen until then."
>
> "The approval screen shows the tool's `name` instead of its `title`."

## Stated constraints or acceptance

- Requester-stated priority: "**P2.** It blocks MCP plan P5."
- The note's problem statement also names `_meta` as dropped; the proposed shape and the issue do not ask for it.
- Verified against `@fgv/ts-extras-mcp` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-extras-mcp`.

## Stated dependencies

None stated.

## Observations (intake agent's, not the requester's)

- None.
