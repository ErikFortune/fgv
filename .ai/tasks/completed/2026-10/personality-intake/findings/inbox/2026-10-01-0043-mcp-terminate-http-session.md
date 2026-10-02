# ts-extras-mcp: terminate HTTP sessions on close

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#674](https://github.com/ErikFortune/personaility/issues/674) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:05Z. No comments.
- **Long form:** [`ASK-2026-09-29-ts-extras-mcp-hub-readiness.md` § M4](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md) on branch `design/mcp-tools`.

## The request, in their terms

> "`closeMcpSession` should call the SDK's `terminateSession()` before closing an HTTP transport. That sends the Streamable-HTTP `DELETE` which ends the session on the server."

Note: "`closeMcpSession` calls `client.close()` (`session.ts:134`), which aborts the transport but does not send the Streamable-HTTP `DELETE` that ends the server-side session."

## Stated motivation

> "sessions stay open on the server until the server's own idle timeout. Because the hub's pool closes idle sessions, this shows up as session churn on servers that cap their session count."

## Stated constraints or acceptance

- > "It is best-effort, since a server may reply 405."
- Requester-stated priority: "**P3.** It blocks nothing."
- Verified against `@fgv/ts-extras-mcp` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-extras-mcp`.

## Stated dependencies

None stated.

## Observations (intake agent's, not the requester's)

- None.
