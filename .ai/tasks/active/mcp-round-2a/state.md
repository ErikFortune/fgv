# State — `mcp-round-2a`

Implementer's working surface. The brief is frozen; disagreements and open questions live here.

## Progress

- [x] Setup: branch at `c67d6d44`, `rush install` clean.
- [x] Beliefs 1–7 checked against SDK 1.29.0 and source (verdicts in `result.md`).
- [ ] #674 terminate on close — commit 1
- [ ] #676 descriptor `title` / `outputSchema`, `onToolsChanged` — commit 2
- [ ] #675 rich results — commit 3
- [ ] code-reviewer pass, then coverage closure
- [ ] gates (package, repo-wide rebuild + test, change verify)
- [ ] /finalize-task, push

## Findings that shape the build (not in the brief)

1. **The SDK's default `CallToolResultSchema` fails the whole call on one unknown or malformed
   block.** `content` is a zod array over a closed five-way union, so a block of type `"widget"`, or
   an `image` without `mimeType`, rejects the `tools/call` response with a `$ZodError` (today:
   `'protocol'`). The brief's "an unknown block never fails the call" is therefore impossible
   through the default schema. **Decision:** `callTool` passes the SDK's generic `ResultSchema` (a
   loose object that only checks `_meta`), and this package converter-validates the result itself.
   Confirmed in a scratch run: `ResultSchema` passes `content` and `structuredContent` through by
   reference, including an own `__proto__` key; the strict schema drops such a key from
   `structuredContent` silently. So the switch also fixes the `__proto__` loss at the SDK layer.
   The SDK still validates `structuredContent` against a cached `outputSchema` after the request,
   because that runs in `Client.callTool` regardless of the result schema.
2. **`terminateSession()` uses the transport's own abort controller**, so a DELETE to a server that
   never answers stays pending until `close()` aborts it. Bounding it is therefore: race it against
   a fixed timer, then `client.close()` — which aborts the pending DELETE. No new controller needed.
3. `discriminatedObject` indexes its arm table with the server's discriminator (`converters[type]`),
   so `type: "constructor"` reaches `Object` and throws. Not used for blocks; dispatch is a `switch`
   over an `enumeratedValue`-validated type.
4. `singleLine`'s failure message echoes the rejected string raw (`"${from}": …`). Its messages are
   never surfaced here; only `.orDefault()` is used on received strings.

## Decisions taken within the brief's latitude

- `TERMINATE_TIMEOUT_MS = 2000`.
- `__proto__` (#721 lesson): **refuse**. `structuredContent` or `outputSchema` holding an own
  `__proto__` key at any depth is omitted whole (never a partially-dropped value), and the refusal
  is logged at `info` through the session logger without echoing server text.
- Optional block fields that fail validation are dropped individually (the `_normalizeAnnotations`
  precedent); a missing or invalid required field (`uri`, `text`, `mimeType`, `data`) turns the
  block into `unknown`.
- A `tools/list_changed` that lands before the session is handed out is delivered once, on a
  macrotask after `connectMcpSession` returns, so the consumer holds the handle when it fires.

## Open questions

None blocking.
