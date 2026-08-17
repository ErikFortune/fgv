# RESUME — `module-resolution-upgrade`

**Read this first if you are picking this work up cold.** It is the whole state in one page. The
detail lives in `result.md` (exit artifact), `findings/inbox/` (9 findings), and
`.claude/project/esm-emit-design.md` § "Amendment 2".

---

## Where things stand

**PR #609 is complete and self-contained.** It changes almost nothing in the repo on purpose:
`moduleResolution` is now *stated* (`node10`) in 31 projects instead of silently defaulted, the three
webpack apps agree on `bundler`, and one real latent defect is fixed. Verified byte-identical across
8,836 build artifacts. **Merging it closes the stream.** Nothing below is blocked on it.

The stream's actual output is the **measurements**, which turned the original plan on its head.

## The three things a future reader most needs to know

**1. The graded ladder in the brief does not exist.** Steps 1–2 landed. Step 3 ("move to `bundler`
repo-wide") is **not available at any price**: `moduleResolution: bundler` is illegal with
`module: commonjs` (TS5095), as are `node16`/`nodenext` (TS5110), and 29 of 31 projects are
`commonjs`. **`node10` is the only legal value there.** Every path off it changes the emit, so steps
3 and 4 share one prerequisite and are one decision.

**2. Do not build a `bundler`-mode type-check gate.** It was built and swept: 73 errors, 70 of them
because `bundler` does not set the `node` export condition so every dual-entry package resolves to
its *browser* build. `customConditions: ["node"]` takes it to 3 but blinds the pass to `default` —
exactly what the webauthn defect got wrong. Both passes are weaker than the three existing scripts.

**3. Nobody is on our ESM path.** 25 of 25 packages route `node.import` at the **CommonJS** `lib/`.
`dist/` is built, packed, and reached by one browser branch. Measured against real tarballs in an
external `"type": "module"` package: ESM consumers work today (79 named exports via
`cjs-module-lexer`; TS `node16` type-checks, emits and runs). **So the emit decision is not a
compatibility question and must not be sized as one.**

## The open decision (yours, not an agent's)

**Stop shipping `dist`, or fix and activate it.** Neither breaks any consumer.

| | |
|---|---|
| **Stop shipping it** | Consumers see no change. Deletes a tree nobody uses and a whole defect class. Also makes the Rushstack item below permanently unnecessary. |
| **Activate it** | Gains tree-shaking (**~5%** measured on `ts-bcp47`, a data-heavy *low-end* data point) and statically-checkable named exports. |

**Cost of activating, measured by doing it repo-wide and reverting** — not estimated:

| item | size |
|---|---|
| specifier rewrite | codemod over **3,697** sites / 1,374 files; **2** needed hands |
| does it build on today's config? | **yes** — 32 of 35 projects clean, no resolution change first |
| the 3 webpack apps | one line of `resolve.extensionAlias` each |
| **packlet lint conflict** | **1,830 violations** — the blocker |
| `dist/package.json` `{"type":"module"}` | per-package build step, small |
| per-branch `types` | **manifest-only** — no browser rollup needed (see below) |

**The de-risking fact:** extensions build fine under today's `node10`/`commonjs`, so the specifier
work lands **incrementally, package by package, with no flag day.**

**The ordering trap:** add `{"type":"module"}` only *after* the specifiers are fixed. Doing it first
engages webpack's `fullySpecified` and breaks the bundler path that works today.

## Ready to run now, independent of that decision

**Reachability gate + `types` reorder.** 21 of 25 packages declare a `types` condition that can never
be selected (it sits behind `default`, which matches unconditionally). Nothing is broken — node10
consumers read the top-level `types` field and get the rollup — but **all three gates check whether a
named file *exists* and none checks whether the condition naming it can be *selected*.** That blind
spot is the same shape as the webauthn defect.

Two parts, and **the second is the durable one**:
1. `types` first **inside the `node` block only**, across 21 packages. **Manifest-only.** The browser
   branch needs no `types` key — it resolves `lib/index.browser.d.ts` by adjacency, correctly. **No
   browser `.d.ts` rollup has to be built** (an earlier draft of this claimed otherwise; it was wrong).
2. A gate that walks each `exports` object in key order and fails when a condition sits behind one
   that matches unconditionally.

**Type-check the three webpack apps.** They compile via `babel-loader` and are checked by nothing;
`ts-res-ui-playground` has 22 pre-existing errors and `apps/sudoku` 13. Add the step and fix the 35
together — adding it first turns `rush build` red.

## The Rushstack item — conditional, not queued

`@rushstack/eslint-plugin-packlets` compares the packlet entry point by **exact path equality**, so
`../base/index.js` can never satisfy it. The fix is five lines applying the normalization the
*same-packlet* branch already performs (its comment names `"../index.js"` verbatim). **Verified**:
282 → 0 warnings in `ts-utils`, and a genuine bypass (`'../base/result.js'`) is *still* flagged, so it
cannot newly-flag anything.

**Nothing currently decided needs it.** It is a prerequisite of the ESM specifier work and nothing
else — not of #609, not of the reachability work, not of the gates. If the emit decision is "stop
shipping `dist`", it is never needed.

## Two of this stream's own claims were retracted — check before trusting a summary

1. "`ts-bcp47`'s ESM entry is broken" — **wrong.** That was Node's ESM loader pointed at a
   browser-branch entry no consumer reaches. esbuild *and* webpack 5 both bundle it clean.
2. "Fixing `types` needs a browser `.d.ts` rollup" — **wrong.** Adjacency already gives the browser
   branch correct types.

Both came from reasoning off a script header or a manifest instead of running the thing. The
corrections are in the findings; the pattern is worth remembering.

## Environment gotcha

`rush test` shows **one failure in this container only** — `ts-json-base`'s `fileIsMutable`
permission test, defeated by running as `uid 0` (root ignores the `chmod 0o444` it sets up).
Confirmed pre-existing against a clean tree at `af2178cde`. CI runs non-root and is green.
