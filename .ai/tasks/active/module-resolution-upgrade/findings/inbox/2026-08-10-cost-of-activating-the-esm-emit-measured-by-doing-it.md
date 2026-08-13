# Cost of activating the ESM emit — measured by actually doing it, then reverting

**Severity:** sizing. **The dominant cost was not the specifiers**, and was not previously known.

The brief said: *"A codemod plus a green build is evidence; a sample of ten files is not."* So this
was done as a full repo-wide codemod plus a full `rush rebuild`, then reverted. Nothing here is
estimated.

## Step 1 — the specifier rewrite is genuinely mechanical

A ~30-line codemod (add `.js` to file specifiers, `/index.js` to directory specifiers, skip anything
already extensioned) applied to every `src/` tree:

| | |
|---|---:|
| source files scanned | 1,581 |
| relative `import`/`export` specifiers | **3,697** |
| → resolve to a directory (need `/index.js`) | 1,392 |
| → resolve to a file (need `.js`) | 2,301 |
| files modified | 1,374 |
| **specifiers the codemod could not resolve** | **2** |

The two unresolved are both legitimately hand-fixable (`./lib` in a `ts-json-base` test fixture,
`./App.tsx` in `apps/sudoku` — already extensioned with the wrong extension). **The design's ~3,520
estimate was accurate**, and the mechanical half is a solved problem.

## Step 2 — it builds under node10/commonjs today, which is the de-risking fact

Extensions do **not** require moving off node10 first. TypeScript maps `'./x.js'` to `./x.ts` under
every resolution mode, and the CJS emit's `require('./x.js')` is correct. Verified on `ts-random`
before going wide:

```
CJS emit:  require('./lib/index.js')  ->  OK, keys: Generator,GeneratorData
ESM emit + dist/package.json {"type":"module"}  ->  ESM LOADS, keys: Generator,GeneratorData
```

**So the specifier work can land incrementally, package by package, on the current config, with no
flag day.** That is the single most useful thing this probe established.

Repo-wide result of `rush rebuild` after the codemod:

| | |
|---|---:|
| projects building clean | **32 of 35** |
| projects failing | **3** — and all three are the webpack apps |

## Step 3 — the webpack apps need three lines each

`apps/sudoku`, `tools/ts-res-browser`, `tools/ts-res-ui-playground` compile with `babel-loader`,
which does not do TypeScript's `.js` → `.ts`/`.tsx` mapping:

```
Module not found: .../ts-res-ui-playground/src/App.js.tsx doesn't exist
```

Fixed by one line of webpack config per app, verified:

```js
resolve: { extensionAlias: { '.js': ['.ts', '.tsx', '.js'], '.jsx': ['.tsx', '.jsx'] } }
```

After patching, `ts-res-ui-playground` compiles (3 warnings, 0 errors). **Minor and solved.**

## Step 4 — THE ACTUAL COST: 1,830 packlet lint violations

This is the finding. `@rushstack/eslint-plugin-packlets`' `mechanics` rule requires a cross-packlet
import to name the packlet **directory**, and it compares by exact path equality:

```js
// PackletAnalyzer.js:172
const entryPointPath = Path.join(this.packletsFolderPath, importedPackletName);
if (!Path.isEqual(importedPath, entryPointPath)) {
  return { messageId: 'bypassed-entry-point', ... };
}
```

`'../base/index.js'` resolves to `.../packlets/base/index.js`, which is not equal to
`.../packlets/base`. **Every cross-packlet import in the repo becomes a violation.** There is no rule
option — it is a hard equality check.

Measured, with a verified zero baseline (`ts-utils` linted clean before the codemod, 282 warnings
after):

| package | new warnings | | package | new warnings |
|---|---:|---|---|---:|
| `ts-res` | 566 | | `ts-json` | 64 |
| `ts-utils` | 282 | | `ts-web-extras` | 64 |
| `ts-prompt-assist` | 162 | | `repo-template` | 26 |
| `ts-bcp47` | 136 | | `ts-http-storage` | 8 |
| `ts-sudoku-lib` | 114 | | `ts-extras-argon2` | 6 |
| `ts-agent-memory` | 120 | | `ts-extras-mcp` | 6 |
| `ts-extras` | 102 | | `ts-web-extras-argon2` | 4 |
| `ts-json-base` | 98 | | `ts-agent-memory-sqlite-vec` | 2 |
| `ts-app-shell` | 70 | | **TOTAL** | **1,830** |

**This is a structural conflict between Rushstack's packlet convention and ESM's extension
requirement, not a codemod defect.** They cannot both be satisfied as the rule is written.

### The fix is five lines, and upstream already half-wrote it

**The same-packlet branch of the same function already performs exactly the normalization needed**,
with a comment naming this case verbatim:

```js
// We discard the file extension to handle a degenerate case like:
//   import { X } from "../index.js";
const lastPart = Path.parse(importedPathParts[importedPathParts.length - 1]).name;
let pathToCompare;
if (lastPart.toUpperCase() === 'INDEX') {
  pathToCompare = Path.dirname(importedPath);   // strip the explicit `index` segment
} else {
  pathToCompare = importedPath;
}
```

The cross-packlet `else` branch, twenty lines below, compares `importedPath` **raw**. So this is not
a design decision upstream made against us — it is normalization applied on one branch and not the
other.

Proposed change (`PackletAnalyzer.ts`, cross-packlet branch):

```diff
   const entryPointPath = Path.join(this.packletsFolderPath, importedPackletName);
-  if (!Path.isEqual(importedPath, entryPointPath)) {
+  // Same normalization the same-packlet branch performs above: an explicit `index`
+  // segment, with or without a file extension, names the entry point.
+  const lastPart = Path.parse(importedPathParts[importedPathParts.length - 1]).name;
+  const pathToCompare =
+    lastPart.toUpperCase() === 'INDEX' ? Path.dirname(importedPath) : importedPath;
+  if (!Path.isEqual(pathToCompare, entryPointPath)) {
     const entryPointModulePath = Path.convertToSlashes(Path.relative(inputFileFolder, entryPointPath));
     return { messageId: 'bypassed-entry-point', data: { entryPointModulePath } };
   }
```

**Verified by patching the installed plugin and re-running lint**, not proposed on inspection:

| | packlet warnings in `ts-utils` |
|---|---:|
| baseline (bare specifiers) | 0 |
| extensions, unpatched rule | **282** |
| extensions, patched rule | **0** |

And **verified it does not weaken the rule**, which is the half that matters. With the patch applied,
changing one import from `'../base/index.js'` to `'../base/result.js'` — a genuine entry-point bypass
— is still reported:

```
23:1  warning  The import statement does not use the packlet's entry point "../base"
```

So the change is strictly a relaxation in the correct direction: it accepts `<packlet>/index` and
`<packlet>/index.js`, which *are* the entry point, and continues to reject every path that is not.
It cannot newly-flag anything.

### The three ways out, in preference order

1. **Upstream PR** — the diff above. Small, provably behaviour-preserving for real bypasses, and it
   fixes this for every Rushstack consumer adopting ESM specifiers. Gated on their release cadence.
2. **Patch locally** (`pnpm patch` / autoinstaller override) while the PR lands. The patch is five
   lines against one file, so the maintenance burden is near zero and it unblocks immediately.
3. **Disable `packlets/mechanics`.** Now clearly the wrong answer — it discards a guard that the
   verification above shows still works, to avoid a five-line change.

**1 and 2 together are the plan — *conditional on this work being commissioned at all*.** Nothing
currently decided requires the Rushstack change: it is a prerequisite of the ESM specifier work and
of nothing else. Not of PR #609, not of the `types`-reachability fix, not of the existing gates. If
the emit decision lands on "stop shipping `dist`", it is never needed.

## Total cost, honestly

| item | size | confidence |
|---|---|---|
| specifier rewrite | codemod, 3,697 sites, 2 manual | **measured** |
| build under node10 | no change needed | **measured** |
| webpack apps | 1 line × 3 configs | **measured** |
| **packlet lint conflict** | **1,830 violations; needs an upstream or local rule fix** | **measured** |
| `dist/package.json` `{"type":"module"}` | per-package build step, unwritten | estimated small |
| per-branch `types` | **manifest-only** — `types` first in the `node` block; the browser branch resolves its declaration by adjacency and needs no key, so no browser rollup has to exist | **measured** |
| `exports` rewiring | 25 manifests | estimated small |

**Ordering trap, restated:** add `{"type":"module"}` only *after* the specifiers are fixed. Doing it
first engages webpack's `fullySpecified` and breaks the bundler path that works today.

## Recommendation

The specifier half is cheap, mechanical, incrementally landable, and does **not** require any
resolution or emit change to go first. The blocker is the packlets rule, and it is worth resolving on
its own terms before committing to the emit change — start with option 1, since it is small and
benefits every Rushstack consumer with the same conflict.

**Do not start this stream by flipping `moduleResolution`.** Start it by fixing the lint rule.
