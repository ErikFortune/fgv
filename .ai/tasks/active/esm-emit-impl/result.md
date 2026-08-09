# Result — `esm-emit-impl`

**Branch:** `esm-emit-impl`, based on `fix/esm-node-entry-points` @ `cebf10bae` (which is `release`
@ `792b87b5e` plus R1, the ESM entry-point gate, four change files, and the consumer reply).

---

## Summary — the stream's central finding is a negative one

The brief asked for R2 + R5, then a triage, then the `ts-bcp47` fix, then R3 per package behind a
green gate. That sequence was followed exactly, and it worked: the gate found real defects, the
triage was non-empty, and R3 was applied to four packages on measured evidence.

**Then the full build ran, and R2 and R3 both turned out to break `tools/ts-res-ui-playground`, the
repo's webpack app. Both were reverted.**

The cause is one the design already understood but had aimed at the wrong step. The `dist` ESM emit
contains extensionless directory imports (`from './packlets/base'`) — which is *why* Node cannot
load it, and is the bug that started this whole line of work. The design assumed bundlers did not
care:

> **Shape of the gate.** … bundlers resolve extensionless directory imports happily …

That is true of **esbuild** and false of **webpack 5**, which applies `fullySpecified` resolution to
anything it treats as ESM. Two separate things trigger it: declaring the tree ESM (which is exactly
what R2's generated `dist/package.json` does), and pointing webpack at the tree (which is what R3
does).

Bisected on an otherwise identical tree:

| Tree | webpack errors in `ts-res-ui-playground` |
|---|---|
| base branch, unmodified | **0** |
| + R2 | **6** |
| same tree, only `libraries/ts-utils/dist/package.json` deleted | **0** |

So:

- **R2 is not the safe, independent one-liner §4 called it.** It converts a harmless Node warning
  into a hard build failure for the four packages already routed at `dist`.
- **R3 is not gated on a bundler-resolution check. It is gated on Option B** — explicit specifiers,
  the ~3,520-edit codemod the design deferred for want of a consumer asking. Option B is the
  precondition for *any* correct consumer of the ESM emit, browser bundlers included. **R3's
  measured win is not available without it.** They are one change, not two competing ones, which
  materially changes how Option B's cost/benefit should be weighed.

This is the deliverable. It is not the one the brief expected, but it is load-bearing: shipping
R2+R3 would have broken a real consumer, and the gate the design specified would have called it
safe.

## Gate status per command

| Command | Result |
|---|---|
| `rush rebuild` | ✅ green (full monorepo) |
| `rush test` | ✅ green — see the one environmental exception below |
| `rushx build` / `lint` / `test` in `libraries/ts-bcp47` | ✅ green, 100% coverage maintained |
| `node common/scripts/verify-esm-entrypoints.mjs` | ✅ 23 checked, 2 declared bundler-only, 0 failed |
| `node common/scripts/verify-bundler-resolution.mjs` | ✅ 19 checked, 6 declared node-only, 0 failed |
| `tools/ts-res-ui-playground` webpack build | ✅ 0 errors (was 6 under R2, which is why R2 reverted) |
| `rush change --verify` | ✅ green |

**One environmental test failure, not caused by this stream and not fixed by it.**
`ts-json-base`'s `mutableFsTree.test.ts` → "returns permission-denied for read-only file". The test
writes a file, `chmod`s it to `0o444`, and asserts the write path reports `permission-denied`; this
container runs as **uid 0**, and root bypasses file-mode permissions, so the write succeeds and the
expected failure never occurs.

Attributable to the environment rather than to this diff on two independent grounds: **this stream
modifies no file in `ts-json-base`** (`git status` lists none — the R3 `package.json` edit was
reverted), and the assertion depends only on `fs.chmodSync` semantics under the current uid. It
passes in CI, which does not run as root. Not suppressed and not worked around.

## Files changed

**Shipped:**

| Path | What |
|---|---|
| `common/scripts/verify-bundler-resolution.mjs` | **new** — R5 gate |
| `common/autoinstallers/rush-bundler-check/{package.json,pnpm-lock.yaml,pnpm-workspace.yaml}` | **new** — esbuild for the gate |
| `.github/workflows/ci.yml` | wire the gate + its autoinstaller into CI |
| `common/scripts/verify-esm-entrypoints.mjs` | §5.1 — both `BUNDLER_ONLY` reasons amended to name the rig |
| `libraries/ts-bcp47/src/packlets/iana/index.node.ts` | **new** — node-only IANA barrel |
| `libraries/ts-bcp47/src/packlets/iana/index.ts` | stop re-exporting the filesystem loader |
| `libraries/ts-bcp47/src/index.ts` | node entry imports `iana/index.node` |
| `libraries/ts-bcp47/src/test/unit/iana/languageRegistriesLoader{,-zip}.test.ts` | repoint at the node barrel |
| `libraries/ts-bcp47/config/jest.config.json` | add `index.node.js` to the existing barrel coverage-ignore list |
| `libraries/ts-bcp47/etc/ts-bcp47.api.md` | regenerated (not hand-edited) |
| `libraries/ts-web-extras-webauthn/package.json` | `exports` only — fix the dangling `default` condition |
| `common/changes/@fgv/{ts-bcp47,ts-web-extras-webauthn}/*.json` | change files |
| `.claude/project/esm-emit-design.md`, `docs/WORKSTREAMS.md`, `docs/FUTURE.md`, the PersonAIlity reply | docs |
| `.ai/tasks/active/esm-emit-impl/findings/inbox/*` | four findings |

**Implemented, measured, reverted** (present in the branch's history, not in its final diff):
`rigs/heft-dual-rig/profiles/default/config/typescript.json` and
`libraries/ts-bcp47/config/typescript.json` (R2); `exports` on `ts-app-shell`, `ts-json-base`,
`ts-extras`, `ts-res` (R3).

## The R5 triage table

24 published packages, first full run, **before** any `exports` block was touched — the sequencing
the brief called load-bearing. It was: the run found two real defects, one of them unrelated to
anything the design had predicted.

| Package | Verdict | Note |
|---|---|---|
| `ts-agent-memory` | resolves clean | |
| `ts-agent-memory-sqlite-vec` | **needs a builtin** → declared | `sqlite-vec` imports `node:url`; native `better-sqlite3` |
| `ts-app-shell` | resolves clean | |
| **`ts-bcp47`** | **FAILED → fixed here** | `fs`/`path` via `languageRegistriesFileLoader` |
| `ts-extras` | resolves clean | |
| `ts-extras-argon2` | **needs a builtin** → declared | `argon2` native addon → `node:crypto` |
| `ts-extras-mcp` | **needs a builtin** → declared | MCP SDK stdio transport → `node:process` |
| `ts-extras-ollama` | **needs a builtin** → declared | `ollama` → `node:fs` |
| `ts-extras-transformers` | resolves clean | |
| `ts-extras-webauthn` | resolves clean | |
| `ts-http-storage` | **needs a builtin** → declared | own `fsProvider` → `fs`, `fs/promises`, `path` |
| `ts-json` | resolves clean | |
| `ts-json-base` | resolves clean | |
| `ts-prompt-assist` | resolves clean | |
| `ts-random` | resolves clean | |
| `ts-res` | resolves clean | |
| `ts-res-ui-components` | resolves clean | `BUNDLER_ONLY` for the *Node* gate; bundles fine, as expected |
| `ts-sudoku-lib` | resolves clean | |
| `ts-sudoku-ui` | resolves clean | as above |
| `ts-utils` | resolves clean | |
| `ts-utils-jest` | **needs a builtin** → declared | own `fsHelpers` → `fs`, `path` |
| `ts-web-extras` | resolves clean | |
| `ts-web-extras-argon2` | resolves clean | |
| `ts-web-extras-transformers` | resolves clean | |
| **`ts-web-extras-webauthn`** | **FAILED → fixed here** | `default` pointed at a never-built file |

**Deferred, none.** Every failure was either fixed here or declared with a reason. The six
declarations are **inferred, not owner-confirmed** — filed as a finding requesting a yes/no per
package, because the sibling gate's own comment is explicit that inferred entries are the weaker
basis and "silently harden into policy".

## Measured before/after for R3

Taken before the revert, mirroring the design's §7 method: esbuild, `platform: browser`, minified,
tree shaking **on**, CJS `lib` entry vs ESM `dist` entry. Recorded so the Option-B-enabled follow-up
need not re-derive them.

| Package | namespace import | best narrow import | ratio |
|---|---|---|---|
| `ts-app-shell` | 1,650,511 → 857,664 B | `MessagesLogger` 1,650,526 → 227,449 B | 1.92× / **7.26×** |
| `ts-json-base` | 130,000 → 57,292 B | `isJsonObject` 130,013 → 40,742 B | 2.27× / **3.19×** |
| `ts-extras` | 517,662 → 488,262 B | `Hash` 517,667 → 319,858 B | 1.06× / 1.62× |
| `ts-res` | 1,079,546 → 996,976 B | 1,079,575 → 828,820 B | 1.08× / 1.30× |
| `ts-web-extras` | 567,129 → 588,421 B | 567,159 → 562,978 B | 0.96× / 1.01× |
| `ts-json` | 170,802 → 185,212 B | 170,835 → 178,887 B | **0.92× / 0.95×** |

`ts-json-base`'s 3.19× independently corroborates the design's 3.48% figure — different symbol, same
order — so the methods agree where they overlap. The last two rows do not: both are **larger** as
ESM. §7 flagged "the wins generalize" as inferred; the inference was wrong for a third of the
candidates. The rule that generalizes instead: **a clean bundler probe is a precondition for
routing, not a reason to route.**

## Observability self-audit

The gate is a CI script, not library code, so the `ts-utils-logging` convention (inject an `ILogger`,
never `console.*`) does not apply — it writes to stdout/stderr like its sibling
`verify-esm-entrypoints.mjs`, which is the correct register for a build gate.

What it reports, and why each is there:
- a one-line summary always (`N checked, N declared, N skipped, N failed`), so a green run still
  says what it covered;
- every failure with the **package, the condition it resolved, and the resolved target**, so a
  failure names the mapping rather than only the error — the sibling's stated rationale for
  hand-rolling resolution rather than delegating;
- `--verbose` per-package lines, `--measure` bundle sizes, `--probe-esm` for the routing question;
- an explicit hard failure when **esbuild itself is missing**, rather than skipping. A gate that
  passes when its own tooling is absent reports success for checks it never ran.

Gap, stated: failures print esbuild's message and location but not the full import chain from the
entry to the offending module. For `ts-bcp47` that chain (entry → `packlets/bcp47` → `../iana` →
loader) had to be traced by hand. Not worth building a module-graph walker for; worth knowing.

## Convention-compliance sweep

- **No `any`**, no unsafe casts. The gate is plain ESM JavaScript (matching its sibling), so the
  TypeScript rules do not bind it; nothing in it casts.
- **Result pattern** — not applicable: no `Result`-returning TypeScript was added. The `ts-bcp47`
  change is a re-export split; it adds no logic and no new failure path.
- **`rush add`** was not used and must not be: esbuild is scoped to a **Rush autoinstaller**
  (`common/autoinstallers/rush-bundler-check`), the mechanism the repo already uses for
  `rush-prettier`. It has its own `package.json` and lockfile and does **not** touch the shared
  shrinkwrap or the monorepo's dependency graph — deliberately, since the guide warns that
  dependency changes here are hard to unwind.
- **100% coverage** maintained in `ts-bcp47`. The new `index.node.ts` barrel is added to that
  package's existing `coveragePathIgnorePatterns`, which already lists `index.js`,
  `index.browser.js`, `public.js`, and `internal.js` — the same kind of file, following the existing
  convention rather than adding a directive.
- **`etc/*.api.md` regenerated**, never hand-edited.

## Sibling sweep — did the new gate diverge from `verify-esm-entrypoints.mjs`?

Its sibling is the reference, and the brief asked specifically about the declaration-over-skip
posture. Deliberately kept identical:

| Aspect | Sibling | This gate |
|---|---|---|
| Declaration list, not silent skip | `BUNDLER_ONLY` + rationale comment | `NEEDS_NODE_BUILTINS`, same posture, comment cross-references it |
| Hand-rolled condition resolution | walks `node`→`import`→`default` | walks `browser`→`import`→`default`, same stated reason |
| Enters the failing path | actually `import()`s each entry | actually bundles each entry |
| Header explains *why gates missed it* | yes | yes |
| Exit non-zero listing every failure | yes | yes |

**Two deliberate divergences, both improvements, and one is a fix to a flaw the sibling still has:**

1. **"Not built" no longer masks a dangling pointer.** The sibling reports a missing artifact as
   `SKIP … (not built)`, indistinguishable from a package that simply has not been compiled — so a
   condition pointing at a file that will *never* exist reads as a skip forever. This gate fails
   instead when the package has produced build output but the named artifact is absent. **That
   change is what turned `ts-web-extras-webauthn` from a silent skip into a finding.** The sibling
   has the same blind spot and was not changed here (out of scope); worth a follow-up.
2. **`--probe-esm` reports BLOCKED, not just clean/fails.** Added after the webpack discovery: a
   package whose emit esbuild bundles but whose specifiers are not fully specified is marked
   **BLOCKED — do not route**, because webpack would fail. This encodes the finding above so the
   next attempt fails fast with the reason instead of rediscovering it by breaking a build. Current
   verdict: **10 dual-rig packages BLOCKED, 4 clean.**

The header also states plainly what a green result does *not* prove — that esbuild is more permissive
than webpack, so bundling with one bundler is weaker evidence than it looks.

## Review — layer 1 (`code-reviewer` on the final diff, before any coverage work)

**Verdict: approved. No P1, no P2.** Four P3 advisories; three applied, one correctly deferred.

| # | Finding | Disposition |
|---|---|---|
| P3-1 | `resolveBrowserTarget` walks a fixed `browser`→`import`→`default` order, but real resolution honors the order the `exports` object declares. Agrees for every package today; a future package declaring a bare `import` ahead of `browser` would get a silently wrong target. Inherited from the sibling, not introduced here. | **Applied** — documented as a known simplification, naming the fix (iterate `Object.keys(root)`) for whoever hits it. Not changed behaviorally: doing so now would diverge from the sibling with no package to justify it. |
| P3-2 | The specifier regex could match prose in a surviving TSDoc comment ("imported from './foo'"). No real instance found in the current emit. | **Applied** — comment lines are dropped before scanning. Deliberately line-based, not a real comment stripper: mangling code would turn a false positive into a false *negative*, which is the worse direction here. |
| P3-3 | The temp entry file is removed in a `finally`, so a `SIGKILL`/OOM mid-run could strand it in a package folder, matched by no `.gitignore` pattern. | **Applied** — `**/.verify-bundler-resolution.entry.mjs` added to `.gitignore`, with a comment saying it only covers the killed-process case. |
| P3-4 | The sibling's own "not built" vs "dangling pointer" ambiguity remains in `verify-esm-entrypoints.mjs`. | **Deferred, as the reviewer agreed** — out of this stream's scope. The new gate demonstrates the fix; flagged for follow-up. |

The reviewer independently verified the two things most worth being wrong about: that `ts-bcp47`'s public API is unchanged on **both** entries (the `Iana_2` doubling in `api.md` is an internal doc-model artifact; the exported `Iana` namespace shape is untouched), and that the gate's **exit-code path** has no silent-skip hole. Both match the independent runtime checks recorded above.

Gate re-run after the P3 fixes: unchanged — 19 checked, 6 declared, 0 failed; same 10 BLOCKED / 4 clean probe verdict.

## Review — layer 2 (Copilot on the open PR)

**Round 1: 4 comments, all substantive, all applied.** No disputes.

| Comment | Disposition |
|---|---|
| `verify-esm-entrypoints.mjs` skips a missing artifact as "not built", so a dangling `exports` pointer passes CI forever — the new gate already fixes this; the sibling should too | **Applied.** This is the same hole `code-reviewer` raised as P3-4 and I deferred as out of scope. Two independent reviewers converging on it outweighs the scope argument, especially in a PR whose subject *is* that class of defect. The same guard as the sibling, with a comment citing the `ts-web-extras-webauthn` instance it would have caught. **No behavior change today** — the gate reports 0 skipped either way — so this is pure future-proofing, not a risk. |
| `index.node.ts`'s header claims only `src/index.ts` imports it, but the tests do too | **Applied.** The comment was simply wrong. Reworded to say `src/index.ts` is the only *shipped* importer, name the tests as the other one, and state the actual invariant: nothing reachable from `index.browser.ts` may import it. |
| `REPO_ROOT` uses `new URL(import.meta.url).pathname` — brittle for percent-escaped and Windows paths | **Applied** to the new gate. A real portability bug: a checkout under a path containing a space resolves to `.../my%20repo/...`. |
| Same, in `verify-esm-entrypoints.mjs` | **Applied.** Inherited — the new gate copied the idiom from its sibling, so both were wrong and both are fixed. |

Verified after: both gates green (23/2/0/0 and 19/6/0/0), `ts-bcp47` build and lint clean, `etc/ts-bcp47.api.md` unchanged (the `index.node.ts` edit is comment-only).

**Loop status:** round 1 was substantive — one real portability bug in two files, one inaccurate comment, and one genuine silent-pass hole in a gate. Not nitpick territory, so the loop continues rather than stopping at an arbitrary round count. Re-requesting review on the follow-up commit.

## Open questions

- **OQ-1 (how far to take R3) — answered "none, and here is why."** Not the partial the brief
  anticipated. Four packages were routed on measured evidence and reverted when the webpack build
  failed. The brief's stop condition — *"a rushed R3 that ships a browser build nobody bundled is
  not [a fine outcome]"* — is exactly what happened, except the build **was** bundled, by the repo's
  own webpack app, which is the only reason it was caught. Four packages
  (`ts-extras-transformers`, `ts-extras-webauthn`, `ts-web-extras-transformers`,
  `ts-web-extras-webauthn`) probe genuinely clean, being single-file packages with no relative
  specifiers to get wrong; they were still not routed, because none has an in-repo webpack consumer
  to validate against and esbuild-only evidence is precisely what failed here.
- **OQ-2 (`module` field) — unchanged, as recommended.** No `module` field was added, removed, or
  repointed. Nothing R5 found implicates it.
- **OQ-3 (#603) — raised, not acted on, as recommended.** This branch contains all of #603.
  Recommend closing it rather than retargeting; the orchestrator's call.
- **New — should Option B be commissioned?** This stream's recommendation is yes, scoped as *the
  enabler for R2 + R3* rather than as native-ESM support. Its cost was weighed against a capability
  no consumer had asked for; it is in fact the precondition for the browser-bundler win the design
  measured at 3.5×, which changes the calculus.
- **New — are the six node-only declarations correct?** Inferred, not owner-confirmed. Filed.

## Deviations from the brief

1. **R2 and R3 reverted.** The brief mandated both. They are implemented and measured in the
   branch's history, and reverted on evidence. This is the largest deviation and the main finding.
2. **`libraries/ts-bcp47/config/typescript.json` and `config/jest.config.json` edited**, neither in
   the brief's in-scope list. The first was required because that package overrides the rig's
   TypeScript config wholesale and so would not have inherited R2 (now reverted, so this edit is
   gone). The second adds the new barrel to an existing coverage-ignore list.
3. **`libraries/ts-web-extras-webauthn/package.json` changed** — a package other than `ts-bcp47`.
   The brief says to file a finding rather than fix another package, but that rule is about *source*
   edits ("R3 is an `exports` change, not a source change"), and `libraries/*/package.json` —
   `exports` fields only — is explicitly in scope. Leaving it red was not an option with the gate
   landing in the same PR. Both fixed and filed.
4. **A new Rush autoinstaller was added.** The brief did not anticipate the gate needing a
   dependency. The autoinstaller is the repo's existing mechanism for exactly this and has no blast
   radius on the shared shrinkwrap.
5. **The `ts-bcp47` fix is not the shape the brief suggested.** The brief proposed excluding the
   loader from `index.browser.ts`, following the `ts-extras` split. That exclusion was *already
   there* — the leak entered below it, from ~26 files in sibling packlets importing the node `iana`
   barrel. Fixed at the barrel instead. One consequence, accepted: API Extractor now emits one more
   `ae-forgotten-export` warning (13 vs a baseline of 12) because the node entry and the internal
   packlets reference two different `iana` module namespaces. The rolled-up `.d.ts` declares both
   and is self-consistent — verified in `dist/ts-bcp47.d.ts` — and `api.md` grew by 2 lines.
