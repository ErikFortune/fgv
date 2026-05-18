# Brief — fix F15: ts-extras browser barrel missing Yaml export

**Source:** pressure-test finding F15 (P1 blocking) at
`.ai/tasks/active/ts-prompt-assist/pressure-test-findings.md`.
**Unblocks:** browser-side verification of the pressure-test
integration on `samples/ai-image-gen-sample` (PR #373). Until this
lands, `@fgv/ts-prompt-assist` is unusable in any webpack/Vite/etc.
browser bundle — the library's index module throws at evaluation,
so the app never mounts.

## Problem

`@fgv/ts-extras/package.json` ships split conditionals in
`"exports"."."`:
- `"node"` → `./lib/index.js` (exports `Yaml`)
- `"default"` → `./lib/index.browser.js` (**does NOT export `Yaml`**)

`@fgv/ts-prompt-assist`'s `fileTreePromptStore.js` does
`require("@fgv/ts-extras")` and at module init calls
`ts_extras_1.Yaml.yamlConverter(...)`. Browser bundlers pick the
`"default"` conditional, get the browser barrel, find `Yaml === undefined`,
and throw `TypeError: Cannot read properties of undefined (reading 'yamlConverter')`
during `fileTreePromptStore.js` evaluation.

The Yaml packlet itself is browser-safe (`js-yaml` is pure-JS, no
node-only deps), so the omission appears to be an oversight in the
original node/browser barrel split, not a deliberate exclusion.

## Acceptance criteria

- [ ] `libraries/ts-extras/src/index.browser.ts` imports `Yaml` and
      re-exports it alongside the existing namespaces (alphabetical
      ordering preserved).
- [ ] `libraries/ts-extras/lib/index.browser.js` regenerated.
- [ ] api-extractor / api.md regenerated.
- [ ] `rushx build` / `rushx lint` / `rushx test` in `@fgv/ts-extras` green.
- [ ] The pressure-test sample (`samples/ai-image-gen-sample`) loads
      in `webpack-dev-server` without the F15 TypeError. The base/formal
      tone toggle drives `library.resolve` and the rendered system
      prompt updates accordingly. (Manual browser smoke; sample has no
      tests.)
- [ ] **Regression gate added** (see below).
- [ ] `rush change` file for `@fgv/ts-extras` (type: `patch` — additive
      browser-barrel export, no API surface diff vs. the Node barrel).
- [ ] No changes to `@fgv/ts-prompt-assist`. The library is correct;
      the bug is one floor down.

## Regression gate (load-bearing)

The reason F15 escaped phase B's acceptance criteria is that the
package-level `rushx build / test / lint` gates only verify the Node
build path — there's no browser-bundle smoke that would have caught
"the browser barrel is missing an export the library consumes."

**Recommended:** the cheapest gate is the pressure-test sample
itself. Once PR #373 merges, `samples/ai-image-gen-sample`'s
`rushx build` (webpack production) runs as part of `rush build`
and implicitly proves `@fgv/ts-prompt-assist` browser-loads. If that
gate is judged too coupled to a sample's continued existence, an
alternative is a tiny `libraries/ts-extras/src/test/unit/browserBarrelExports.test.ts`
that statically lists the expected browser-barrel exports and
fails on drift — no webpack required, runs under Jest.

Pick one or the other (sample-as-gate is preferred for blast-radius
realism; the static export test is the belt-and-braces fallback).
Either is sufficient.

## Out of scope (do NOT do in this stream)

- Do **not** refactor the broader Node/browser barrel-split design.
  The split is established surface; the fix is one missing export,
  not a rethink.
- Do **not** audit other potentially-missing exports beyond the
  obvious Yaml fix. F15's note about `ZipFileTree` being in the
  browser barrel (despite usually-node-only zip libs) is worth a
  separate stream if it ever becomes a real problem — but it didn't
  bite the pressure-test, so it's not in this stream's scope.
- Do **not** patch `@fgv/ts-prompt-assist`. Its
  `fileTreePromptStore` module-init usage of `Yaml.yamlConverter` is
  correct — Yaml is genuinely needed by `FileTreePromptStore` regardless
  of the file-tree backend (in-memory, fs, zip, browser FSA all carry
  YAML descriptor files), so the right place to fix is the
  browser barrel, not the consumer.

## Handoff

When the fix lands:
- Update F15 in `pressure-test-findings.md` to "Closed in <PR#>" with
  a one-line note.
- Notify the pressure-test stream (PR #373) so the author can rebuild
  and run the browser smoke to confirm the integration works
  end-to-end. If anything else surfaces from the real-browser run,
  the author appends to `pressure-test-findings.md`.

## References

- Finding F15 in `.ai/tasks/active/ts-prompt-assist/pressure-test-findings.md`
- Pressure-test PR: https://github.com/ErikFortune/fgv/pull/373
- Affected files (read-only context): `libraries/ts-extras/src/index.ts`
  (the Node barrel — Yaml is exported here as the reference),
  `libraries/ts-extras/src/index.browser.ts` (the file to edit),
  `libraries/ts-extras/package.json` `"exports"` map.
