# Finding — six packages are declared node-only in the new gate on *inferred*, not confirmed, intent

**Found by:** `esm-emit-impl`, populating `NEEDS_NODE_BUILTINS` in `verify-bundler-resolution.mjs`
**Severity:** process, not code — the declarations are almost certainly right, but they are the
implementer's reading, and the sibling gate is explicit that this distinction matters
**Needs:** a yes/no from the package owner on each

## What

`verify-bundler-resolution.mjs` fails any published package whose browser-facing condition cannot be
bundled for a browser, unless the package is declared node-only with a reason. Six packages failed
the first full run and are now declared:

| Package | Why it cannot bundle |
|---|---|
| `@fgv/ts-agent-memory-sqlite-vec` | `sqlite-vec` imports `node:url`; also binds `better-sqlite3` (native addon) |
| `@fgv/ts-extras-argon2` | `argon2` imports `node:crypto` (native addon) |
| `@fgv/ts-extras-mcp` | `@modelcontextprotocol/sdk`'s stdio client transport imports `node:process` |
| `@fgv/ts-extras-ollama` | `ollama` imports `node:fs` |
| `@fgv/ts-http-storage` | its own `packlets/storage/fsProvider` imports `fs`, `fs/promises`, `path` |
| `@fgv/ts-utils-jest` | its own `helpers/fsHelpers` imports `fs` and `path` |

All six read as node-only *by construction* — native addons, a stdio transport, a filesystem storage
provider, and a Jest helper library. Four of the six fail on a third-party dependency's node
imports, not on anything this repo wrote. Three of them (`ts-extras-argon2` and the two
`ts-web-extras-*` siblings) sit either side of a deliberate node/browser package split, which is
itself strong evidence of intent.

## Why this is filed rather than simply done

`verify-esm-entrypoints.mjs`'s `BUNDLER_ONLY` list carries this note, and the new gate mirrors its
posture deliberately:

> Both entries below are **confirmed intent from the package owner** (2026-08-08), not this
> script's inference from how they happen to be consumed today. That distinction matters: an
> inferred entry would be a guess that silently hardens into policy, which is exactly the failure
> mode this list exists to avoid.

The six entries added here are **inference**. They are the implementer's reading of what each
package is for, not an owner's statement, and by the sibling script's own standard that is a weaker
basis. The alternative — leaving the gate red on six packages — would have made it un-mergeable and
trained everyone to ignore it, which is worse. So they are declared, and the weakness is recorded
here rather than hidden in a comment that reads as settled.

## Ask

Confirm or correct each row. Any package that is *not* intended to be node-only should have its
entry removed and its browser graph fixed instead — the entry is a decision, not a suppression, and
removing one is the supported way to change that decision.
