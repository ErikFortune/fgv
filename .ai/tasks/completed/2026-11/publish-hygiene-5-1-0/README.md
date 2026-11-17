# publish-hygiene-5-1-0 — packaging and documented-import fixes for 5.1.0

**Shipped**: 2026-11-17 into `integration/asks` via #792.

## Summary

A consumer validated `5.1.0-63` from the registry and found documented imports that fail, `exports`
maps with `types` out of order, files that should not ship, and no `CHANGELOG.md` in the tarballs.
All four are fixed for the stable 5.1.0 publish, and `@fgv/ks` joins the lockstep release:

- Every documented `@fgv/<pkg>/<subpath>` that is not a real export was rewritten to the root
  import or namespace that resolves (`ts-extras`, `ts-utils`, `ts-json-base`, `ts-json`, and the
  packages that point at `ts-extras/ai-assist`). No subpaths were added.
- `types` is first in every `exports` condition object, every target starts with `./` (22
  manifests).
- Every published package has a `files` allowlist; the 16 `.npmignore`s are gone. `perf/`,
  `scripts/`, test data, `eslint.config.js`, `.rush/`, `rush-logs/` and the theme's `src/` no
  longer ship; `lib/`/`dist/` contents are unchanged in every package.
- `CHANGELOG.md` ships in all 33 tarballs.
- `@fgv/ks` is on the `base-utils` policy and publishes with 5.1.0.
- The `@fgv/ts-utils` dependency-vs-peer inconsistency is recorded in `docs/TECH_DEBT.md`.

## Files changed

- `libraries/*/package.json`, `tools/*/package.json`, `rigs/heft-dual-rig/package.json`,
  `plugins/typedoc-compact-theme/package.json` — `files`, `exports` order.
- 16 `.npmignore` files deleted.
- `rush.json` — `@fgv/ks` published on `base-utils`.
- Docs: `libraries/{ts-extras,ts-utils,ts-json-base,ts-json,ts-extras-ollama,ts-extras-transformers}/CAPABILITIES.md`,
  `libraries/{ts-json,ts-agent-memory-sqlite-vec,ts-extras-ollama}/README.md`,
  `libraries/ts-extras/src/packlets/ai-assist/README.md`, `.ai/instructions/LIBRARY_CAPABILITIES.md`.
- `docs/TECH_DEBT.md` — P2 entry.
- `common/changes/@fgv/*/publish-hygiene-5-1-0_2026-11-17-00-00.json` (33).

## How to verify

```bash
node common/scripts/verify-tarball-exports.mjs
# per package: (cd <dir> && pnpm pack) and tar -tzf the result
```

`result.md` has the before/after file counts, the type-resolution traces, and the `CHANGELOG.md`
probe.

## Decisions made during execution

- **`.npmignore` deleted rather than kept beside `files`.** With an allowlist the root ignore file
  no longer decides anything, and two sources of truth is how `CHANGELOG.md` went missing.
- **The type-resolution premise did not reproduce.** TypeScript 5.0–5.9 resolved the declared
  `types` target from the old order too; the reorder is spec conformance (`result.md` § 2).
- **`src/` not shipped for sourcemaps.** No package shipped it before, and the maps embed
  `sourcesContent`.

## Artifacts

`brief.md` (contract, with the `ks` scope addition), `result.md` (outcome, counts, proofs, gates),
`meta.yaml`.
