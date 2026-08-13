# Finding — 11 packages ship `src/`, compiled tests, and Rush internals in their tarball

**Filed by:** `publish-tarball-gate`
**Severity:** medium — not a correctness defect; tarball bloat plus internal-metadata leakage
**Status:** detected, **not fixed** (this stream builds a detector; `libraries/*` is out of its scope)

## What was measured

Computed with `npm-packlist` on a fully built tree, and verified byte-identical to
`npm pack --dry-run --json` on four packages. Counts are files in the tarball that *would* publish
today:

| Package | total | `src/` | `.rush/` | compiled tests | `.npmignore` |
|---|---:|---:|---:|---:|---|
| `@fgv/ts-agent-memory` | 548 | 75 | 6 | 238 | **NO** |
| `@fgv/ts-prompt-assist` | 443 | 60 | 6 | 70 | **NO** |
| `@fgv/ts-extras-mcp` | 107 | 12 | 6 | 28 | **NO** |
| `@fgv/ts-agent-memory-sqlite-vec` | 71 | 7 | 6 | 14 | **NO** |
| `@fgv/ts-extras-ollama` | 65 | 6 | 6 | 28 | **NO** |
| `@fgv/ts-extras-argon2` | 56 | 5 | 6 | 14 | **NO** |
| `@fgv/ts-web-extras-argon2` | 49 | 4 | 6 | 7 | **NO** |
| `@fgv/ts-web-extras-webauthn` | 58 | 2 | 6 | 7 | **NO** |
| `@fgv/ts-extras-transformers` | 37 | 2 | 6 | 7 | **NO** |
| `@fgv/ts-web-extras-transformers` | 37 | 2 | 6 | 7 | **NO** |
| `@fgv/ts-extras-webauthn` | 36 | 2 | 6 | 7 | **NO** |

Every one of the 14 packages that *does* carry an `.npmignore` ships **0** of each. The split is
exactly the presence or absence of that file — there is no third pattern.

## Why it matters

Three separate costs, in increasing order of seriousness:

1. **Bloat.** `ts-agent-memory` ships 238 compiled test files and 75 source files a consumer never
   loads.
2. **`.rush/temp/shrinkwrap-deps.json` is published.** Six files per affected package under
   `.rush/` are Rush's internal build metadata. They describe our dependency graph and have no
   consumer meaning; they are an implementation detail of this monorepo escaping into a public
   artifact.
3. **It is the precondition for the 5.1.0-27 class.** These packages have *no declared position* on
   what ships. They inherit npm's defaults. A package with no stated pack contract cannot be said
   to have shipped the wrong thing — which is precisely why "we shipped only `src/`" was possible
   and went unnoticed.

## Recommended direction (not applied here)

Prefer a **`files` allowlist over an `.npmignore` denylist.** No `@fgv` package declares `files`
today, so every package's tarball is defined by what it *forgot* to exclude rather than by what it
means to ship. An allowlist (`"files": ["lib", "dist", "README.md", "LICENSE"]`) states the contract
positively, and the failure mode inverts usefully: forgetting to add something produces a missing
file the tarball gate catches loudly, rather than a silently over-broad tarball nobody inspects.

This interacts with finding #2 (npm will not prune the directory containing `main`), which makes the
denylist approach less predictable than it appears.

## Not fixed here, deliberately

Fixing this means editing `libraries/*` manifests, which the `publish-tarball-gate` brief places
out of scope: *"This stream builds a detector, not fixes. If the gate finds a package that would
ship broken, that is a finding."* The gate does **not** currently fail on any of this — every
package's named `exports` paths are present. This is a hygiene finding, not a gate failure.
