# post-510-package-cleanup — READMEs, a LICENSE and a description for 5.1.0's bare packages

**Shipped**: 2026-11-20 via #800.

## Summary

Checking the published 5.1.0 tarballs found eight packages with no `README.md`, because none
existed in the repo — their `files` allowlists already named it. Each now has one, written from the
package's actual exports and checked by typechecking the examples against the built packages.
`@fgv/typedoc-compact-theme` also gains the MIT `LICENSE` its siblings carry, and `@fgv/ts-random`
gets a package description in place of `""`. No source code changed.

## Files changed

- `README.md` in `libraries/{ts-extras-argon2,ts-web-extras-argon2,ts-http-storage,ts-random,ts-extras-webauthn,ts-web-extras-webauthn}`,
  `rigs/heft-dual-rig` and `plugins/typedoc-compact-theme`.
- `plugins/typedoc-compact-theme/LICENSE`.
- `libraries/ts-random/package.json` (`description`).
- Eight `patch` change files, `common/changes/@fgv/<pkg>/post-510-package-cleanup_2026-11-20-00-00.json`.

## How to reproduce the pack check

```bash
node common/scripts/install-run-rush.js install
cd libraries/ts-random && ../../common/temp/pnpm-local/node_modules/.bin/pnpm pack --pack-destination /tmp/pc
tar -tzf /tmp/pc/fgv-ts-random-5.1.0.tgz | grep -E 'README|LICENSE'
```

## Decisions made during execution

- **Only `ts-random` had a placeholder description.** `ts-utils` and `ts-extras` share the generic
  "Assorted Typescript Utilities"; that is a real, long-published description, so it was left.
- **The theme README leads with what the plugin does to `out`.** It deletes the directory, writes
  its own Markdown, and exits the process before TypeDoc's renderer runs — the one behavior a new
  consumer most needs to know before pointing it at a directory.
- **The rig README shows the repo's own configs**, not a generic Heft setup: `rig.json`, the node
  rig's `tsconfig-base.json`, a Jest config extending this rig's (so the coverage gate holds), and a
  `typedoc.json` extending `typedoc.compact-base.json`.

## Follow-ups

See `result.md` § Follow-ups.

## Artifacts

`brief.md` (contract), `result.md` (outcome, pack table, gates), `meta.yaml`.
