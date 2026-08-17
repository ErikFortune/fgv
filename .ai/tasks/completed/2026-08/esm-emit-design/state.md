# State — `esm-emit-design`

Branch: `esm-emit-design` (from `release` @ `792b87b5e`)

## Checkpoints

### 2026-08-08 — design complete

Deliverable `.claude/project/esm-emit-design.md` written; all six brief questions answered; exit
artifact at `result.md`; two findings filed to `findings/inbox/`. No source, config, rig, or
`package.json` change in the diff.

**Verified by running** (Heft 1.2.7 / heft-node-rig 2.11.27 / TypeScript 5.8.3 / Node 22.22.2,
scratch dir since deleted):

- `emitMjsExtensionForESModule: true` **errors** against the current rig (module-kind collision with
  `additionalModuleKindsToEmit`), and run alone **does not rewrite specifiers** — `.mjs` output still
  fails `ERR_UNSUPPORTED_DIR_IMPORT` *and* `ERR_MODULE_NOT_FOUND`. The crux the brief named: answered
  negative, decisively.
- `emitModulePackageJson: true` writes `dist/package.json` `{"type":"module"}` and removes the
  typeless warning — settles Q4 without a root `"type": "module"`.
- Explicit `./x/index.js` specifiers load natively in Node with **no `moduleResolution` change**.
- Published 5.1.0-47: reproduced the consumer's error; measured ESM-vs-CJS bundle sizes.

**Inferred, not run:** that no consumer needs native Node ESM (silence, not a stated no — OQ-1 stays
open); generalization of the tree-shaking wins past the three packages measured.

### What the brief got wrong

1. **Two required-reading files are not on this branch.** `common/scripts/verify-esm-entrypoints.mjs`
   and `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md` live only on the
   unmerged `fix/esm-node-entry-points`. Read from there read-only via `git show`. Worth correcting in
   any successor brief.
2. **OQ-1's suggested resolution is half wrong on evidence.** "Keep the interim shape" — right.
   "Delete the broken `dist` ESM emit / stop maintaining a build nothing loads" — wrong. The emit is
   *unwired*, not worthless: 17 of 21 dual-rig packages publish a tree-shakeable ESM build that their
   own `exports` does not point at, worth a measured 92.6 KB (3.5×) on `@fgv/ts-json-base` alone.
   Deleting it would convert a wiring gap into a permanent capability loss.
3. **The four enumerated options did not contain the answer.** Each was costed as asked, but the
   recommendation is a fifth — route *browser bundlers* at the existing emit — which the brief could
   not have anticipated because the bundler row of the consumer table had never been measured.

## Next

Awaiting review. The implementation stream commissioned from this should sequence
R2 (rig one-liner) + R5 (bundler gate) first, triage what R5 finds, then R3 (per-package `browser`
conditions) behind it. Option B (explicit specifiers) remains a separate, later stream and is no
more expensive for having waited.
