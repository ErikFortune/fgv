# Workstream Brief: `module-resolution-upgrade` — choose `moduleResolution` deliberately

## Mission

The repo resolves modules under **node10**, and nobody chose it. Move it forward in graded steps,
each independently valuable, stopping wherever the evidence stops justifying the next one. The
headline benefit is not modernity: it is that **three of the packaging defects that shipped this
month become compile errors**.

## Status entering

Established and verified — see `.claude/project/esm-emit-design.md` § "Amendment —
`moduleResolution` is the missing variable".

`rigs/heft-dual-rig` inherits `@rushstack/heft-node-rig`'s `tsconfig-base.json`, which sets
`module: commonjs` and **never sets `moduleResolution`**. TypeScript therefore defaults it to
`"node"` — node10, the pre-`exports` algorithm. Three projects override it, disagreeing with each
other and recording no reason:

| Project | `moduleResolution` |
|---|---|
| `tools/ts-res-ui-playground` | `"node"` |
| `tools/ts-res-browser` | `"node"` |
| `apps/sudoku` | `"bundler"` |

**Why it matters, verified by running a probe** against `@fgv/ts-utils/lib/index.js` — a subpath the
`exports` map does not expose and that Node refuses at runtime:

| `module` / `moduleResolution` | result |
|---|---|
| `commonjs` / `node` — **today** | **accepts it** — `exports` not enforced |
| `node16` / `node16` | rejects it |
| `nodenext` / `nodenext` | rejects it |
| `esnext` / `bundler` | rejects it |

Under node10 **TypeScript does not read the `exports` map at all.** That is the structural reason
`@fgv/ts-web-extras-webauthn`'s `default` condition could name a file that never existed, for the
package's entire life, with every build green.

## In-scope paths (you may modify)

- `rigs/heft-dual-rig/**` — the `moduleResolution` setting
- `tools/ts-res-ui-playground/tsconfig.json`, `tools/ts-res-browser/tsconfig.json`,
  `apps/sudoku/tsconfig.json` — the three overrides
- `libraries/*/tsconfig.json`, `tools/*/tsconfig.json` — only if a step requires per-project opt-in
- `libraries/*/src/**` — **only under deliverable 4**, and only specifier changes
- `common/changes/**`, `etc/*.api.md` (regenerate, never hand-edit)
- `.claude/project/esm-emit-design.md` — record what each step actually cost
- `docs/WORKSTREAMS.md` (this stream's entry), `docs/FUTURE.md`

## Out-of-scope paths (you must NOT modify)

- `common/scripts/verify-*.mjs` and their CI/publish wiring — **the gates stay**. This work does not
  replace them (see "What this does not cover")
- `libraries/*/package.json` `exports` blocks — if a step flags one as wrong, that is a **finding**
  unless fixing it is what unblocks the step, in which case fix it and say so
- The 11 packages shipping `src/` and `.rush/` internals — a filed finding, a publishing behavior
  change, and explicitly not this stream

## Required reading

- `.claude/project/esm-emit-design.md` — **the Amendment in full**, then § 2 Option B and § 3
- `rigs/heft-dual-rig/profiles/default/config/typescript.json` — the dual emit, which is the
  complication in deliverable 4
- `common/scripts/verify-esm-entrypoints.mjs` header — what the gates own, so you do not duplicate it
- `.ai/instructions/MONOREPO_GUIDE.md`, `.ai/instructions/ACTIVE_DEVELOPMENT.md`

## Missing-input rule (non-negotiable)

If any required-reading file is missing or unreadable: **STOP** and surface it. Do not reconstruct
it from exploration.

## Dependencies

**Hard:** the packaging integration must have landed on `release` (it carries the amendment this
brief rests on). Branch from `release` once it has.

## Deliverables — graded, and you may stop between any two

1. **Make today's behavior explicit.** Set `moduleResolution: "node"` in the rig. **Changes
   nothing at all** — it converts an unchosen default into a chosen one, and is the precondition for
   moving it deliberately. Verify by confirming a full `rush rebuild` is byte-identical in outcome.
2. **Reconcile the three overrides.** Two pin `"node"`, one uses `"bundler"`, none says why. Decide
   one answer, apply it, and record the reason. If `apps/sudoku` genuinely needs `"bundler"`, that
   is a finding worth stating rather than a discrepancy worth erasing.
3. **Move to `bundler` repo-wide, and fix what it flags.** This is the step with the best
   evidence-to-cost ratio: it enforces the `exports` map — making the webauthn class a compile error
   — without demanding specifier changes. **Expect it to flag real things.** Every flag is either a
   genuine broken import or a package whose `exports` is wrong; triage each, and file rather than
   bulk-fix anything outside this stream's scope.
4. **Evaluate `node16`/`nodenext` — evaluate, not necessarily adopt.** This is Option B: it
   additionally requires fully-specified relative specifiers (~3,520 sites by the design's count).
   Two things must be settled first, and if either is unresolved **stop and report rather than
   pushing through**:
   - **The dual emit.** `node16` determines module format from `package.json` `type` and file
     extension, not from an emit flag. One source tree emitting `commonjs` to `lib` and `esnext` to
     `dist` is exactly what it is least happy with. Design § 2 Option D raised this and left it open.
   - **Whether the specifier change is mechanical.** A codemod plus a green build is evidence; a
     sample of ten files is not.

## Acceptance criteria

- [ ] Deliverable 1 lands and demonstrably changes no output
- [ ] The three overrides agree, with the reason recorded
- [ ] If step 3 lands: everything it flagged is fixed or filed, with the triage listed
- [ ] If step 4 is attempted: the dual-emit question is answered before any specifier is touched
- [ ] The gates still run and still pass — this work does not touch them
- [ ] `rush build` / `rush lint` / `rush test` green; `rush change --verify` green
- [ ] `code-reviewer` on the final diff **before** coverage work; Copilot loop driven
- [ ] Docs ship with the code: design doc records what each step cost, ledger entry updated

## What this does NOT cover — state it, do not let it drift

Compiler enforcement catches a broken `exports` condition **for code the repo itself imports**. It
would **not** have caught `@fgv` 5.1.0-27, which shipped only `src/` — a packing failure with a
perfectly valid config, visible only to `verify-tarball-exports.mjs`. The gates and the compiler
cover different failure modes. **Rolling forward retires neither, and any PR description implying
otherwise is wrong.**

## Open questions

- **OQ-1 — how far is worth going?** Steps 1–3 are cheap and well-evidenced. Step 4 is large and its
  benefit over step 3 is the specifier class, which no consumer has reported. **Recommended:** land
  1–3, then present step 4 as a decision with the dual-emit answer in hand, rather than deciding it
  up front.
- **OQ-2 — does `bundler` cost anything for Node consumers?** It models bundler resolution, and our
  packages are consumed from Node too. Confirm it does not weaken checking for the Node path before
  adopting it repo-wide.
- **OQ-3 — does the rig change belong upstream?** The setting is inherited from
  `@rushstack/heft-node-rig`. Setting it in our rig is a local override; whether that is the right
  layer is worth one paragraph, not a refactor.

## Findings-inbox convention

`.ai/tasks/active/module-resolution-upgrade/findings/inbox/<timestamp>-<slug>.md`, one per file.

## Required exit artifact

`.ai/tasks/active/module-resolution-upgrade/result.md`: branch; which deliverables landed and which
were deliberately not attempted; the triage list from step 3; the dual-emit answer if step 4 was
evaluated; gate status; open questions; deviations.

## Why the grading is the point

The temptation is to treat this as "upgrade to node16" and drive to it. The evidence does not
support that as a single move: step 3 buys most of the defect-prevention for a fraction of the cost,
and step 4's remaining benefit is a class no consumer has hit. **Landing steps 1–3 and stopping is a
success, not a partial failure.** The design's original rejection of Option B was reasoned and is
only revised, not reversed, by the amendment.
