# Result — `publish-tarball-gate`

**Branch:** `claude/publish-tarball-gate-omgb9e`, based on `esm-emit-impl` @ `29d07bcba`.
**PR:** against `release`.

## Summary

`common/scripts/verify-tarball-exports.mjs` computes the file list npm would actually pack for each
published package and asserts that every path the manifest names is in it — **every `exports`
condition, every subpath**, plus `main` / `types` / `module` / `bin` and both forms of `browser`. It is wired into per-PR CI
and, as the hard gate, into **all six** publish workflows.

Result on the current tree: **31 packages checked, 215 manifest paths verified, 0 failed, ~5.8 s.**

The class is demonstrated, not just the instance: five neutralizations, covering the defect we
already fixed, the one nothing could previously see, and the `bin` / `browser`-map surfaces.

## The instrument, and its measured cost

**Chosen: `npm-packlist`** — the library npm itself uses to decide tarball contents.

| Instrument | Cost | Notes |
|---|---|---|
| `npm pack --dry-run --json` | **7.6–8.2 s per package** → ~3.3 min for 25 | ground truth; the brief measured ~12.8 s/pkg, same conclusion, smaller magnitude on this container |
| `npm-packlist` + `Arborist.loadActual()` | **7.7 s per package** → ~3.2 min | no better than `npm pack`; the cost is the dependency-graph resolution, not the pack computation |
| **`npm-packlist` + minimal tree node** | **5.8 s for all 31** (186 ms avg) | what shipped |
| hand-rolled ignore rules | n/a | rejected — would drift from real npm behavior, and a gate that models packing incorrectly is worse than no gate |

**The decisive measurement is the second row.** The obvious way to use `npm-packlist` is to hand it
an Arborist tree, and doing so would have put this gate right back in the cost bracket that rules
out `npm pack` — the ~12.8 s/package figure the brief warned about would have been reproduced by the
recommended library. `npm-packlist` itself costs ~20 ms; `loadActual()` costs 7.7 s. So the gate
passes the minimal tree node `npm-packlist` actually reads.

**Validated, not assumed.** Output was compared against `npm pack --dry-run --json` on four packages
spanning both shapes in this repo — `ts-web-extras-webauthn` and `ts-extras` (no `.npmignore`),
`ts-utils` and `ts-app-shell` (with one). **Byte-identical in all four: same file count, same sorted
list.** The minimal tree was separately confirmed to produce the identical list to the `loadActual`
tree.

The one thing the minimal tree gives up is `bundleDependencies` (packed out of `node_modules`,
invisible to a directory walk). No `@fgv` package declares it, and rather than assume that, the gate
**fails loudly** with an actionable message if one ever does.

## Neutralization — five demonstrations

The brief required two. A third was added because the second turned out not to reproduce what it
claimed (see Findings #2); the fourth and fifth cover the `bin` and `browser`-map surfaces added in
Copilot rounds 1 and 2.

| # | Simulation | Result |
|---|---|---|
| 1 | Revert the `ts-web-extras-webauthn` fix: `default` → `./lib/index.browser.js` | **FAILS**, exit 1, names `. > default > import` and `. > default > require` |
| 2a | `@fgv/ts-utils`: add `lib/` + `dist/` to `.npmignore` | **FAILS**, exit 1, names the 4 `dist`-targeted paths |
| 2b | `@fgv/ts-random`: build output **absent from disk** — the true 5.1.0-27 shape | **FAILS**, exit 1, all 7 paths, with the no-build-output diagnosis |
| 3 | `@fgv/ts-res-cli`: `bin` pointed at a non-existent file | **FAILS**, exit 1, names `(bin.ts-res-compile)` |
| 4 | `@fgv/ts-bcp47`: a `browser` **map value** pointed at a non-existent file | **FAILS**, exit 1, names `(browser["./lib/index.js"])` |

Each was reverted immediately and `git status --porcelain libraries/` confirmed empty after each;
the gate returns to `0 failed` in every case.

**Demo 1 is stronger than it looks.** It fires on the `default` condition, which Node never selects
(the `node` block wins). A gate that checked only the condition Node resolves — which is what both
sibling gates do — stays green on it. This is the every-condition property doing real work.

**Demo 2b is the one the brief actually cares about**, and 2a alone would have been a false
demonstration: it does not produce a build-less tarball at all (see below).

## Findings filed

All three in `findings/inbox/`. #1 and #2 are hygiene / mental-model findings the gate does not fail
on; **#3 is a live defect the gate caught**.

1. **11 packages ship `src/`, compiled tests, and `.rush/` internals.** `ts-agent-memory` ships 238
   compiled test files and 75 source files; `.rush/temp/shrinkwrap-deps.json` (internal Rush build
   metadata) is published by all 11. The split is *exactly* the presence or absence of an
   `.npmignore` — there is no third pattern. Recommended direction: a `files` allowlist rather than
   an `.npmignore` denylist, so a package's tarball is defined by what it means to ship rather than
   by what it forgot to exclude. **Not fixed here** — `libraries/*` is out of scope by the brief.
2. **npm will not prune the directory containing `main`.** Reproduced on a minimal fixture and
   confirmed against real `npm pack`, not just the library: with `main: lib/index.js`, an
   `.npmignore` reading `lib/` excludes nothing under `lib/` — not just the `main` file, the *whole
   directory* survives — while `dist/` is pruned normally. Two consequences: an `.npmignore` line
   can be silently inert, and **a misconfigured `.npmignore` alone cannot produce the 5.1.0-27
   tarball** — that shape requires the build output to be genuinely missing at pack time, which
   points the remedy at the publish pipeline rather than at packaging config.
3. **`@fgv/ts-res-browser` ships `main` and `types` naming a `lib/` it never builds.** Every
   published version has carried two dangling pointers; the package's real entry is its `bin`, which
   works, so nothing ever complained — the same silently-worked-around shape as 5.1.0-27. Found by
   the first run of the widened gate, and **fixed here** rather than left red (Deviations #4).

## Placement — OQ-1, resolved as *both*

**Publish-time is the hard gate**, wired into all six publish workflows immediately before
`Rush Publish` (so it reads the same tree npm packs): `publish-{alpha,release,major}-impl.yml` and
`publish-{alpha,major,}-legacy.yml`. The three `-legacy` workflows are `workflow_dispatch`-triggerable
and are therefore live bypass paths, not dead files — a gate that must never be bypassed has to cover
them.

**Per-PR CI as well**, because the brief's condition for it was met: ~5 s is unnoticeable, so the
fast-feedback copy costs nothing meaningful. Placed after the two sibling gates in `ci.yml`.

## Reconciling with the existing existence pass — deviation from the brief's recommendation

The brief recommended **superseding** `verify-esm-entrypoints.mjs`'s existence check, so there is one
owner rather than two that can disagree. **That was considered and declined**, with the reasoning
recorded in both script headers:

- The two **cannot disagree in the dangerous direction.** A packed file necessarily exists in the
  tree, so this gate passing can never mask a failure there. The reverse — a file present locally
  that never enters the tarball — is the 5.1.0-27 defect, and only the pack-list gate sees it.
- The sibling's `existsSync` is not a free-standing existence check; it is the **guard that makes its
  `import()` meaningful**. Removing it would not remove a duplicate check, it would remove the
  precondition of the loadability check, which is the part this gate genuinely does not cover.

So ownership was split explicitly rather than merged: this script owns *"does every condition name a
file that actually ships"*; the sibling owns *"does the entry load"*. Both headers now cross-reference
the other. **Correction to the brief's premise:** it states that #603 added a pass checking "every
path named anywhere in an `exports` map… under every condition". No such pass exists in the base —
both sibling gates resolve exactly one condition each. This gate is the first every-condition check
in the repo, which makes it additive rather than a supersession.

## OQ-2 and OQ-3

- **OQ-2 — packages that legitimately ship no build output.** None exist. The `SOURCE_ONLY`
  declaration map ships **empty**, in the `BUNDLER_ONLY` / `NEEDS_NODE_BUILTINS` style, so a future
  such package has somewhere to say so on the record. No silent skip was added; an absent artifact
  always fails, which is the inverse of both siblings' skip-when-unbuilt behavior and is deliberate
  — "not built" *is* the defect here.
- **OQ-3 — should it also *load* each packed entry?** **Existence shipped; loading did not.**
  Recorded in `docs/FUTURE.md` with its cost (a real pack, an extract, and a dependency install per
  package before any import resolves) and the narrow residual case it would close: an artifact that
  packs, and loads from the tree, but would fail from an extracted tarball because something it
  reaches at runtime was not packed. The consumer note says plainly which half shipped, since they
  asked for both.

## Gates

| Check | Result |
|---|---|
| `rush install` | ✅ |
| `rush rebuild` | ✅ green (required — the gate needs real build output) |
| `verify-tarball-exports.mjs` | ✅ 31 checked, 212 paths, 0 failed, ~5.8 s |
| `verify-esm-entrypoints.mjs` | ✅ 23 checked, 2 declared, 0 failed |
| `verify-bundler-resolution.mjs` | ✅ 19 checked, 6 declared node-only, 0 failed |
| `rush change --verify` | ✅ (no publishable package touched → no change file owed) |
| Workflow YAML | ✅ all 8 parse |
| Shared shrinkwrap | ✅ untouched; dependency scoped to the `rush-pack-check` autoinstaller |
| `libraries/*` source or `exports` | ✅ unmodified (findings filed instead) |
| `tools/*` | ⚠️ one subtractive manifest fix — see Deviations #4 |

## `code-reviewer` — run before any coverage work

Per layer-1 sequencing. **No P1s. Two P2s, three P3s.**

- **P2 — `bundleDependencies: false` tripped the guard.** Real latent bug: `false` is npm's explicit
  "bundle nothing" and needs no special handling, but the guard threw on it. **Fixed**, and the five
  forms (absent / `false` / `[]` / `true` / `['x']`) verified to throw only on the last two.
- **P2 — ledger, consumer note, and `result.md` missing from the diff.** A staging-order artifact:
  the review ran against a snapshot taken before those were written. All three are in the PR.
- **P3 — a package whose `exports` yields zero targets counted as "checked" having verified
  nothing.** This is the silent-pass class the script family exists to remove. **Fixed**, and it
  *fails* rather than warns — an `exports` map naming no file is either a manifest defect or a shape
  the walk does not understand, and both need a look. Verified by setting a package's `exports` to
  `{".": null}`.
- **P3 — undocumented non-string leaf skip** in the walk. **Fixed** with a comment, for consistency
  with the file's own narrate-every-skip discipline.
- **P3 — measurement provenance belonged in an artifact, not only a header comment.** Addressed by
  this document.

The reviewer independently re-derived the two things most worth being wrong about: it exercised
`collectExportTargets` against a synthetic map covering nested conditions, array fallbacks, `null`
targets, subpath keys and `*` patterns, and confirmed the untested `*` branch of `isPacked` behaves
correctly (including spanning path separators, matching Node's subpath-pattern semantics).

## Copilot loop — round 1

**Four comments; three actioned, one declined.** Round 1 was **substantive**, not nitpicky, so the
loop was not stopped here on diminishing returns.

- **`collectPackages()` skipped every package without `exports`** — the round's real finding, and it
  led directly to a live defect. The filter was inherited from the two sibling gates, where it is
  correct (they resolve an `exports` condition; a package without one has nothing to resolve) and
  here it was wrong. It hid **all six publishable `tools/` CLIs**. Fixed, and `bin` added to the
  checked fields — sharper than `main`, because npm symlinks `bin` at **install** time, so a `bin`
  naming an unpacked path breaks the install rather than the first import. Coverage went 25 → 31
  packages, 199 → 214 paths, **and the first run of the widened gate failed on a real defect** (see
  finding #3).
- **`SOURCE_ONLY`'s comment contradicted its implementation** — the comment claimed declaring a
  package "suppresses nothing about this check" while the code `continue`d past verification
  entirely. Correct catch. Resolved by **deleting the map**, not by correcting the comment: the
  comment was struggling to justify a mechanism this gate should not have. Both siblings' declaration
  maps exist because their questions can legitimately be answered "no"; *this* gate's question
  ("are the paths your manifest names in your tarball?") has no legitimate "no", and a genuinely
  source-only package passes on the merits anyway since its `main` names files that are in fact
  packed. An opt-out here had no correct use and one incorrect one — silencing a package that ships
  broken. That is the silent-skip hole the gate exists to close. Reasoning recorded in the file.
- **`String(err.message)` on a non-`Error` throw** would stringify to `undefined` and discard the
  cause, on the one path whose job is to report why the check could not run. Fixed via a `firstLine`
  helper.
- **Declined:** a Windows-portability fix to `bundleForBrowser` in `verify-bundler-resolution.mjs`.
  Real observation, but that file is **base-branch code from #605**, not this stream's, and the brief
  scopes this stream away from it. Filing it against the owning stream is the right route; widening
  this PR into a sibling gate's internals is not.

A fourth neutralization was added for the new surface: pointing a `bin` at a non-existent file fails
the gate, naming `(bin.ts-res-compile)`.

## Copilot loop — round 2

**Two comments, both real, both fixed.** Round 2 again surfaced a genuine coverage gap rather than
nitpicks, so the round-count is not the signal here — the finding profile is.

- **The object form of `browser` was not checked.** `collectManifestTargets` handled only a
  string-valued `browser`. `@fgv/ts-bcp47` uses the **map** form, and its three replacement values
  are real paths a browser build resolves to — one of them `lib/index.browser.js`, *the exact
  filename shape that was dangling in `ts-web-extras-webauthn`*. So this was the live case, not a
  hypothetical. Values are now checked; **keys deliberately are not**, and checking them would have
  been a false-positive: `ts-bcp47` maps `./lib/packlets/iana`, a *directory* specifier that is
  correctly not a packed file, and `"fs": false` (stub-to-empty) names no path at all. Verified
  against the live manifest before choosing. 212 → 215 paths.
- **The pack-list failure record had no counts**, so a package whose pack computation *itself* threw
  would have printed `undefined files would be packed, undefined of them under lib/ or dist/`. The
  counts line is now suppressed on that path — reporting nothing beats reporting `undefined`, and
  the no-build-output diagnosis must not assert anything about a list that was never computed.
  (Copilot also predicted this would trigger the no-build-output banner; it would not —
  `undefined <= 1` is `false` — but the `undefined` print was real.)

## Deviations from the brief

1. **The hard dependency was not met, and the stream ran anyway.** The brief and the kickoff both
   state this is BLOCKED until #603 and #605 land on `release`, then rebase. **Both were still open**
   when this ran (`release` @ `792b87b5`, neither merged). The user was asked how to proceed and did
   not answer, so the call was made to proceed on the current base — which is precisely the state the
   brief describes as the starting point ("This branch is based on `esm-emit-impl` so it already sees
   both"). A rebase onto `release` now would have *deleted* both sibling gates this stream extends.
   **The rebase is still owed** and is recorded in `state.md` and the ledger. There were no conflicts
   to escalate: the base did not move.
2. **Superseding the sibling's existence pass was declined**, with reasoning — see above.
3. **`main` / `types` / `module` / `browser` / `bin` are checked**, and packages with **no
   `exports` at all** are checked, both beyond the brief's "every `exports` target". They are manifest-named paths whose absence from the tarball is the identical
   defect (and demo 2b shows `main` failing in exactly that way), so excluding them would have left a
   gap for no benefit. Reported under their field names so a failure is unambiguous.
4. **`tools/ts-res-browser/package.json` was fixed, against the detector-not-fixer rule.** The
   widened gate found `main` and `types` naming a `lib/` the package never builds (`noEmit: true`,
   webpack-only). Leaving it as a finding would have meant merging this PR with its own required
   check permanently red, blocking every subsequent PR. The correction is subtractive and the
   evidence unambiguous; a `patch` change file accompanies it. Reverting three lines restores the
   pure-diagnostic posture. See finding #3.
5. **A third neutralization was added.** The brief's second demonstration, taken literally
   (`.npmignore`-exclude the build output), does not produce a build-less tarball — finding #2. Demo
   2b reproduces the real shape.

## Open for the orchestrator

- **The rebase onto `release`.** Must happen once #603 and #605 land. Low risk by construction: the
  only file this diff shares with either PR is `verify-esm-entrypoints.mjs`, where the change is an
  additive header comment.
- **Finding #1 wants an owner.** Eleven packages publishing `src/`, compiled tests, and Rush internal
  metadata is a real cleanup, and the `files`-allowlist recommendation is a manifest change across
  those packages — plausibly its own small stream. It interacts with finding #2.
- **The `*`-pattern branch of `isPacked` has no in-repo exercise** — no `@fgv` package uses subpath
  patterns. Reviewed and hand-verified, but it is the one branch with no live coverage, and the first
  package to adopt a pattern export is where it gets its real test.
