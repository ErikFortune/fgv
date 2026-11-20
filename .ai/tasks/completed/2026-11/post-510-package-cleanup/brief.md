# post-510-package-cleanup — brief

*The orchestrator's kickoff prompt, verbatim.*

You are implementing stream `post-510-package-cleanup` in the fgv monorepo (Rush + pnpm; read /home/user/fgv-package-cleanup/CLAUDE.md and the .ai/instructions it includes). Work ONLY in the worktree /home/user/fgv-package-cleanup, branch `post-510-package-cleanup` (based on origin/main 3a541a89f, which carries the published 5.1.0). Push only to `origin post-510-package-cleanup`. No PR, no force-push, no other branches, no npm writes. Do not spawn subagents.

Context: stable 5.1.0 shipped. Checking every tarball found these packages ship with no README.md because none exists in the repo (their `files` allowlists already list README.md/LICENSE, so they ship once written): @fgv/ts-extras-argon2, @fgv/ts-web-extras-argon2, @fgv/ts-http-storage, @fgv/heft-dual-rig, @fgv/typedoc-compact-theme, @fgv/ts-random, @fgv/ts-extras-webauthn, @fgv/ts-web-extras-webauthn. @fgv/typedoc-compact-theme also has no LICENSE. @fgv/ts-random's package.json `description` is "" (prerelease once carried "psedo-random number generator and utilities for TypeScript").

Do:
1. Write a README.md for each of the 8 packages. Model them on sibling READMEs in this repo (e.g. libraries/ts-extras-re2, ts-extras-transformers, ts-extras-mcp — read several first). Each: one-paragraph what-it-is, install line, a short accurate usage example built from the package's actual exports (read src/index.ts and its CAPABILITIES.md if present; every import path you write must be in the package's `exports` — verify), a pointer to CAPABILITIES.md where it exists, and License: MIT. No marketing, no invented features. For heft-dual-rig and typedoc-compact-theme read how the repo itself uses them (rig.json files, typedoc configs) and document that usage.
2. Add a LICENSE to plugins/typedoc-compact-theme copied from a sibling package's MIT LICENSE (same holder/years format as the siblings).
3. Set @fgv/ts-random's description to an accurate one (e.g. "Seeded pseudo-random number generation and word/character corpora for TypeScript" — check its CAPABILITIES.md and README you write so they agree). Check every other base-utils package's package.json for an empty or placeholder description and fix those too (list them in result.md).
4. Verify by packing each changed package (`pnpm pack` from its folder, then `tar -tzf`): README.md (and LICENSE for the theme) present. Put scratch output under /tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/pc/ and delete the .tgz files from the repo tree.
5. Change files: one per touched package, type `patch`, short consumer-facing comment ("Added a README." / "Added a README and LICENSE." / "Added a package description."). `rush change --verify --target-branch origin/main` must pass.
6. Stream artifacts per repo convention: `.ai/tasks/completed/2026-11/post-510-package-cleanup/` (brief.md = this prompt, result.md, README.md, meta.yaml with prs: [] and #TBD, modelled on a sibling such as docs-regen-5-1-0), ledger entry in docs/workstreams/2026-11.md and index line in docs/WORKSTREAMS.md. Run generate-capability-feed.mjs --check, verify-capability-docs.mjs, and `npx -y prettier@2.8.8 --check` on changed files.

Order: write → verify packs → COMMIT → from repo root, foreground: `node common/scripts/install-run-rush.js install` then `rebuild` (logs under /tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/pc/; grade by grep: `not met|Operations failed|error TS|Jest tests? failed|ERR_PNPM` = 0, warnings only the tracked-symlink notice) → push.

Report: head SHA, the files you added/changed, the pack verification, gate results, anything you left alone and why.
