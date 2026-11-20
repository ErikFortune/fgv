# State — `esm-emit-impl`

Branch: `esm-emit-impl` (based on `fix/esm-node-entry-points` @ `cebf10bae`, which is `release`
@ `792b87b5e` plus R1, the ESM entry-point gate, four change files, and the consumer reply)

## Checkpoints

**2026-08-09 — R2 landed, then reverted.** `emitModulePackageJson: true` in the rig, plus the same
in `libraries/ts-bcp47/config/typescript.json` (that package overrides the rig's TypeScript config
wholesale, so R2 was never one line). Verified it writes `dist/package.json` = `{"type":"module"}`
and removes the typeless warning, as the design said. **Reverted later the same day** — see the
final checkpoint.

**2026-08-09 — R5 landed.** `common/scripts/verify-bundler-resolution.mjs` + CI wiring, esbuild via
a new `rush-bundler-check` autoinstaller (its own lockfile; the shared shrinkwrap is untouched).
Mirrors the sibling gate's declaration-over-skip posture.

**2026-08-09 — R5 triage, before touching any `exports` block.** 24 packages: 2 real defects, 6
node-only, 16 clean. Defect 1 was `ts-bcp47`, as the design predicted — gate reproduced its exact
`fs`/`path` failure at `languageRegistriesFileLoader.js:31/32`. Defect 2 was **unpredicted**:
`ts-web-extras-webauthn`'s `default` condition pointed at a file that is never built, so no
bundler/Deno/edge consumer could resolve the package. Found only after tightening the gate to stop
reporting a missing artifact as "not built".

**2026-08-09 — `ts-bcp47` fixed, gate red → green.** The design located the defect at
`index.browser.ts`, but that entry *already* excluded the loader; the leak entered from underneath
via ~26 files in `packlets/bcp47`/`packlets/unsd` importing the node `../iana` barrel. Split at the
barrel: shared `iana/index.ts` drops the loader, new `iana/index.node.ts` carries it, node entry
uses that. Public API unchanged on both entries. Build + lint + tests green, 100% coverage held.

**2026-08-09 — R3 applied to 4 packages, then reverted.** Measured every clean candidate with tree
shaking on: routed `ts-app-shell` (7.26×), `ts-json-base` (3.19×), `ts-extras` (1.62×), `ts-res`
(1.30×); deliberately skipped `ts-json` (0.95×) and `ts-web-extras` (1.01×), which are *larger* as
ESM — the design's "wins generalize" inference was wrong in both directions.

**2026-08-09 — THE FINDING: R2 and R3 both reverted.** The full build showed
`tools/ts-res-ui-playground` failing. Bisected to a single generated file: base tree 0 webpack
errors, +R2 → 6, delete `libraries/ts-utils/dist/package.json` → 0. The `dist` emit's extensionless
directory imports are not valid ESM; **webpack 5 applies `fullySpecified` and rejects them, esbuild
falls back to directory-index resolution and does not.** So the design's "bundlers resolve
extensionless directory imports happily" is true of esbuild only, R2 is not the safe independent
one-liner §4 called it, and R3 is gated on **Option B**, not on a bundler-resolution check. Both
reverted; gate extended to report BLOCKED so the next attempt fails fast. Recommendation on exit:
commission Option B as the enabler for R2+R3.
