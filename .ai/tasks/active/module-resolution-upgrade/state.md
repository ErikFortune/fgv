# State — `module-resolution-upgrade`

Branch: `module-resolution-upgrade`, from `release` @ `af2178cde` (after #608). Hard dependency met —
the packaging integration carrying the amendment this brief rests on had landed.

## Checkpoints

1. **Mapped the tsconfig chain.** The dual rig provides **no** tsconfig — `@fgv/heft-dual-rig` owns
   heft config only, and every project extends `@rushstack/heft-node-rig`'s (or `heft-web-rig`'s)
   `tsconfig-base.json` directly. 23 projects on the dual rig, 6 on `heft-node-rig`, 5 on
   `heft-web-rig` (2 extending its base, 3 freestanding).
2. **Tried a shared fgv-owned layer, twice, and it does not work.** `extends` array → Heft throws
   (`path must be of type string`). Rig-provided base → a workspace symlink makes every relative path
   resolve into `rigs/heft-dual-rig/` instead of the consumer. Filed; answers OQ-3.
3. **D1 landed inline in 31 projects.** Baseline `rush rebuild` → hash → apply → rebuild → hash:
   **8,836 artifacts, zero differences.**
4. **D2 landed.** The two `node` outliers moved to `bundler`, matching `apps/sudoku`. Discovered all
   three are babel-loader and never type-checked; 22 + 13 pre-existing errors. Filed.
5. **D3 blocked, established by measurement.** `bundler` is illegal with `module: commonjs` (TS5095);
   so are `node16`/`nodenext` (TS5110). `node10` is the only legal value. Every path off it changes
   the emit.
6. **Swept a type-check-only substitute across all 29 projects.** 73 errors → 3 with
   `customConditions: ["node"]`; 70 were the browser-entry cause. Neither pass is a gate. Filed;
   answers OQ-2 in the negative.
7. **Audited condition order across all 25 published packages** (prompted by the browser-entry
   result, not by the brief). 21 declare an unreachable `types` condition. Filed — the largest item
   surfaced, and independent of the emit question.
8. **D4 deliberately not attempted.** Its gate is unchanged and now also gates D3.
9. **`code-reviewer` pass.** Caught a real off-by-one in the headline finding's own count (21 of 25,
   not 20) that had propagated into four documents, plus a misclassification of `ts-bcp47` — which is
   in fact the reference shape the finding recommends. Both corrected.
10. **Fixed the `jest-snapshot/build` import** on the owner's call; exports-aware check over
   `ts-utils` now clean.

## Notes for whoever picks this up

- `rush test` shows **1 failure in this container only**: `ts-json-base`'s `fileIsMutable`
  permission-denied test, defeated by running as `uid 0`. Verified pre-existing against a clean tree.
- The probe configs (`tsconfig.resolution-check.json`) were generated per project and deleted. To
  reproduce, extend the project tsconfig with `module: esnext`, `moduleResolution: bundler`,
  `noEmit: true`, and `inlineSources: false` (the upstream base sets `inlineSources`, which errors
  without a sourcemap).
