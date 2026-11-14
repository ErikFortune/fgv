# Finding — 15 published packages declare `"license": "MIT"` and ship no LICENSE file

**Found by:** `packaging-prepublish-fixes` (incidental — surfaced while measuring tarball contents)
**Severity:** low technically, **blocking-ish before a publish** — a declared licence whose text is
not distributed
**Status:** detected, **not fixed**, deliberately — see "Why this was not just fixed"

## What

Every one of these declares `"license": "MIT"` in its manifest and has **no `LICENSE` file on
disk**, so none ships one in its tarball:

```
ts-agent-memory-sqlite-vec   ts-extras-argon2        ts-extras-mcp
ts-extras-ollama             ts-extras-transformers  ts-extras-webauthn
ts-http-storage              ts-random               ts-res-ui-components
ts-sudoku-ui                 ts-web-extras           ts-web-extras-argon2
ts-web-extras-transformers   ts-web-extras-webauthn  ts-app-shell
```

MIT's own terms require the notice accompany copies of the software. A manifest field asserts the
licence; it does not distribute it.

## Why this was not just fixed

It looks like a 15-file copy, and it nearly is — but the existing LICENSE files are **not uniform**.
Five distinct variants exist across the packages that have one, differing in the copyright year:

| variant | count | e.g. |
|---|---:|---|
| (most common) | 5 | `ts-utils` — Copyright (c) 2020 |
| | 2 | |
| | 1 each | `ts-agent-memory`, `ts-prompt-assist` — Copyright (c) 2026 |

Copying an arbitrary one would stamp a copyright year onto a package it may not be right for, which
is a substantive edit to a legal notice rather than a mechanical file copy. **The year is the
author's call, not a defaulting decision.**

## Suggested resolution

Pick the intended year per package — most likely the year the package first shipped — and add the
file. If a single year is acceptable across all of them, this collapses to one `cp` loop and is a
five-minute change.

Worth doing **before the next publish** rather than after: the packages already declare MIT, so each
publish without the text widens the gap rather than holding it steady.

## Note

The `files` allowlist added in this change includes `LICENSE`, so the moment a file exists it ships.
No further packaging work is needed once the files are added.
