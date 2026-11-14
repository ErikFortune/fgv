# Workstream Brief: `esm-emit-design` — design a genuinely Node-loadable ESM build

## Mission

**Design only. No implementation code in this stream.** Decide how `@fgv` should emit ESM so that
a Node ESM consumer can `import` any published package natively, without giving up the
tree-shakeable ESM that browser consumers rely on. An implementation stream is commissioned only
after this design is reviewed.

## Status entering

A consumer (PersonAIlity) found that `@fgv` 5.1.0-47 broke **every** ESM entry point. Reproduced
and verified on our side.

**Root cause, established — `rigs/heft-dual-rig/profiles/default/config/typescript.json`:**

```json
"additionalModuleKindsToEmit": [{ "moduleKind": "esnext", "outFolderName": "dist" }],
"emitMjsExtensionForESModule": false
```

Heft emits a second `esnext` module-kind build into `dist`, written as `.js`. Two consequences,
both confirmed by running Node against the artifacts:

1. **`ERR_UNSUPPORTED_DIR_IMPORT`.** TypeScript does not rewrite import specifiers, so source's
   extensionless *directory* imports (`from './packlets/base'`) land verbatim in the ESM emit.
   Node's ESM resolver does no directory-index resolution and requires extensions, so the module
   dies at evaluation.
2. **`MODULE_TYPELESS_PACKAGE_JSON`.** The ESM output is `.js` in packages with no
   `"type": "module"`, so Node falls back to syntax sniffing to decide the module type.

**An interim fix has already shipped** (branch `fix/esm-node-entry-points`): a `node` condition on
the four affected packages routes both `import` and `require` to the CJS `lib` build, and
`common/scripts/verify-esm-entrypoints.mjs` is wired into CI to load every published entry the way
a Node ESM consumer does. **That fix is not what this stream reconsiders** — it is correct and
stays until something better replaces it. What it costs is the thing to weigh here: **Node
consumers currently get CJS, not native ESM.**

**Why nothing caught it** (this shapes what the design must not repeat): `rush build` resolves
types, which resolve either way; `rush test` runs Jest in CJS and never enters the `import`
condition; `apps/sudoku` is a webpack browser build and `samples/testbed` is a CJS consumer, and
bundlers resolve directory imports happily. Three green gates, one shared blind spot.

## In-scope paths (you may modify)

- `.claude/project/esm-emit-design.md` — **the deliverable**
- `docs/WORKSTREAMS.md` — this stream's own entry
- `docs/FUTURE.md` / `docs/TECH_DEBT.md` — only if the design defers something that belongs there

**No source, no config, no `package.json`, no rig changes.** If the design needs a spike to answer
a question, do it in a scratch directory and delete it; report the result in the doc.

## Out-of-scope paths (you must NOT modify)

- `rigs/**`, `libraries/**`, `tools/**`, `apps/**`, `samples/**`, `common/**`,
  `.github/workflows/**` — all implementation, all a later stream
- The interim fix on `fix/esm-node-entry-points` — do not revert, re-litigate, or depend on its
  being merged

## Required reading (load before designing)

- `rigs/heft-dual-rig/profiles/default/config/typescript.json` — the emit config above
- `rigs/heft-dual-rig/profiles/default/config/heft.json`
- `common/scripts/verify-esm-entrypoints.mjs` — the gate, and its header, which enumerates why the
  existing gates were blind
- `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md` — what we told the
  consumer, including the two open items this stream owns
- The `exports` blocks of `@fgv/ts-utils`, `@fgv/ts-bcp47`, `@fgv/ts-random`, `@fgv/ts-utils-jest`
  (the four with a `node` condition today) and two or three ordinary packages for contrast
- `.ai/instructions/MONOREPO_GUIDE.md`, `.ai/instructions/ACTIVE_DEVELOPMENT.md` (the lockstep
  version policy is a real cost input)

## Missing-input rule (non-negotiable)

If any required-reading file doesn't exist or you can't access it: **STOP** and surface the gap. Do
not recreate it from codebase exploration or improvise what it contained.

## Dependencies

**Hard:** none. Branch `esm-emit-design` exists, from `release` @ `792b87b5e`.
**Soft:** the interim fix (`fix/esm-node-entry-points`) may or may not have merged when you start.
Either way the design targets the end state, not the diff.

## Deliverable

**One document: `.claude/project/esm-emit-design.md`.** It must answer, with evidence rather than
assertion:

1. **What consumers actually need.** Enumerate the real consumer shapes — Node ESM, Node CJS,
   webpack/vite browser, Jest, `tsx` — and which condition each takes. The four affected packages
   have browser consumers with `sideEffects: false`; establish what tree-shaking is actually worth
   here rather than assuming.
2. **The options, each costed.** At minimum:
   - `emitMjsExtensionForESModule: true` — **verify what it actually rewrites.** It changes output
     extensions; whether it rewrites *relative specifiers*, and whether it can turn a directory
     specifier into `./packlets/base/index.mjs`, is the crux. Do not assume either way; test it.
   - Explicit specifiers in source (`./packlets/base/index` + extensions) — repo-wide source
     change; size it honestly, including whether `moduleResolution: node16/nodenext` forces it
     everywhere.
   - Bundling the ESM output to a single file with no internal relative specifiers — symmetrical
     with what API Extractor already does for `.d.ts`; cost is a new build step and source-map and
     `sideEffects` implications.
   - Dropping the dual emit and shipping CJS only — the honest baseline. What is actually lost, and
     for whom?
3. **A recommendation**, with the reasoning that distinguishes it from the runner-up.
4. **`"type": "module"` and the typeless warning** — settled explicitly, not left implicit in the
   choice above.
5. **How the gate changes.** `verify-esm-entrypoints.mjs` currently declares
   `@fgv/ts-res-ui-components` and `@fgv/ts-sudoku-ui` bundler-only. Does the recommended design
   make them loadable, keep them declared, or make the declaration unnecessary?
6. **Migration and blast radius.** Lockstep versioning means a change here moves every package's
   version. Say what breaks, for whom, and whether it is breaking at all.

## Acceptance criteria (the stop point)

- [ ] `.claude/project/esm-emit-design.md` exists and answers all six questions above
- [ ] Every claim about what a tool does is **verified by running it**, not inferred from docs —
      the `emitMjsExtensionForESModule` behavior in particular
- [ ] Each option carries an honest cost, including the one you recommend against
- [ ] The recommendation is explicit, and names what would change your mind
- [ ] Open questions are listed as open, not resolved by assertion
- [ ] No source, config, rig, or `package.json` changes in the diff
- [ ] This stream's `docs/WORKSTREAMS.md` entry is in the same PR

## Handoff contract (what you publish)

- The design doc — consumed by the implementation stream commissioned from it
- A sized recommendation the orchestrator can turn into a brief without re-deriving the analysis

## Open questions to resolve (or record as still open)

- **OQ-1 — does native Node ESM matter to any real consumer today?** The interim fix gives Node
  consumers CJS, and no consumer has yet said that is insufficient. If the honest answer is "no
  current consumer needs it," the right recommendation may be to keep the interim shape, delete the
  broken `dist` ESM emit, and stop maintaining a build nothing loads. **That is a legitimate
  outcome and must be presented if the evidence supports it** — do not assume the goal is native
  ESM because the stream is named after it.
- **OQ-2 — is `module: "dist/index.js"` also a liability?** Several packages still carry the legacy
  `module` field pointing at the same unloadable emit. Bundlers honor it. Settle whether it stays,
  changes, or goes.
- **OQ-3 — dual-emit or single?** Is the two-build-kinds arrangement earning its cost, or is one
  emit plus correct conditions simpler and sufficient?

## Findings-inbox convention

Findings go to `.ai/tasks/active/esm-emit-design/findings/inbox/<timestamp>-<slug>.md`, one per
file. Anything you discover about *other* packages' packaging belongs here, not in the design doc's
recommendation.

## Required exit artifact

`.ai/tasks/active/esm-emit-design/result.md`: branch; one-paragraph summary; the recommendation in
two sentences; what you verified by running versus what remains inferred; open questions; and any
deviation from this brief.

## Resume protocol

Re-read this brief in full, read `.ai/tasks/active/esm-emit-design/state.md`, confirm scope.

## Why this is design-first

The interim fix already stops the bleeding, so there is no pressure to ship a rushed structural
change — which is exactly the condition under which a structural change should be *designed*. The
repo has done this before with the safer-fetch threat model, and the discipline paid: the design
caught that redirect policy and the SSRF guard were one mechanism, which an implementation-first
approach would have shipped as two half-features. Take the same posture here.
