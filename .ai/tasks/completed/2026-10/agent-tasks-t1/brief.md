# Stream brief — `agent-tasks-t1`

**Status: 🟢 ready.** Drafted 2026-09-22, from the agent-tasks design bundle (`docs/design/agent-tasks/`,
merged in #680 as `c27dd647`), slice **T1**.

## Mission

Create `@fgv/ts-agent-tasks` at `libraries/ts-agent-tasks` and land slice **T1** — the package
scaffold, the value types and converters, the versioned detail/command registry, typed handles,
Result-valued factories, and the injected clock/ID/logger contracts. Plus, under A3, the versioned
capacity profile, typed dimension failures, bounded source-replay declarations, and the internal
discriminated `capacityClaims` schema.

**No storage. No broker. No side effects at import.** T1 is the vocabulary the rest of the library
is written in.

## Branch and PR posture

Both this slice and the ones that follow land on an **integration branch** and squash to `release`
as coherent shipping units. T1 does not reach `release` on its own.

| | |
|---|---|
| Integration branch | `integration/agent-tasks-v1` (off `release` at `af05bb319`) |
| T1 | `claude/agent-tasks-t1` → PRs into the integration branch |
| Squash to `release` | opened by the orchestrator, **not** by the implementing agent |

Change-file verification therefore targets the integration branch:
`rush change --verify --target-branch origin/integration/agent-tasks-v1`.

CI runs on PRs into `integration/**`. If a PR shows no checks, stop and say so.

**Why an integration branch — the F1/F2 precedent, and why it applies here.** The
`filetree-atomic-write` stream used one because F1 declared a failure vocabulary of which it
exercised almost nothing: 16 union members across four unions, 5 exercised. Those members were
predictions about a protocol that did not exist yet, and F2 — the slice that made the protocol
real — revised them, dropping one outright. Nothing was ever published carrying the dropped
member, which is exactly what the integration branch bought.

**T1 is the same shape.** It declares the lifecycle, observation, command and recovery unions, and
the A3 capacity schemas whose stated requirement is that "count/byte schemas must make maximum
completion and settlement charges computable before acceptance" — a prediction about what T3, T5
and T8 will need, written before any of them exist. T1's own converter tests will exercise the
*shapes*; they cannot exercise the *choices*. So later slices carry license to revise T1's
vocabulary rather than inherit it, and the integration branch is what makes that cost a diff
instead of a migration.

## Package surface

- `libraries/ts-agent-tasks/` — **new**, and the only package this slice adds.
- `rush.json` — the new project registration.
- Rush dependency/version-policy configuration **via normal tooling only** (`rush add -p …`,
  never a hand-edited `package.json`).

## Out-of-scope

- **Any storage, filesystem or broker code.** T3 owns storage; T5 owns the broker. If you find
  yourself wanting a `FileTree`, you have left the slice.
- The deferred **input-request/answer protocol** — gate #6 is closed as deferred. Tasks carry
  waiting reasons and *opaque host-owned attention references*, nothing more (`deferred.md`).
- Any **task runner, scheduler, retry policy or executor**. The library records work and mediates
  observations and commands; it runs no agent loop.
- **Source-specific fields or consumer vocabulary.** Nothing in T1 may name the reference consumer
  or its concepts — see the review gate.
- `ts-json-base` and every other existing package. T1 consumes them unchanged. A demonstrated
  upstream bug is an escalation, not a fix you fold in.
- `samples/testbed` — P1's job.

## Deliverables (from the plan, verbatim scope)

Package scaffold, root exports, types/converters packlets, bounded common envelope,
lifecycle/observation/command/recovery unions, versioned detail and command registration, typed
handles, Result-valued factories, injected clock/ID/logger contracts. Built-in tracked/list detail
schemas; **no storage side effects at import**.

Under **A3** also: the versioned capacity profile and typed dimension failures/status, bounded
source-replay declarations, and the internal discriminated `capacityClaims` schema from design
§8.6. Cover owner/obligation identities, pending-to-live transfer and reserved-to-used conversion.
**Claims are repository-generated data, not caller-issued authority.**

## Acceptance (from the plan)

- Runtime validation produces the same public shape the type declarations promise.
- Registry erasure uses **converter closures**, not unsafe generic casts.
- Unknown versions/kinds cannot be treated as validated current types.
- Independent schema versions and metadata/source ownership are explicit.
- Bound waiting state contains **only opaque host attention references**.

## Repo gates (every stream's exit)

- [ ] `rushx build` — **zero warnings** (`rushx build` exits 0 on warnings; `rush rebuild` does not)
- [ ] `rushx lint` passes; `rushx fixlint` run before the final commit
- [ ] `rushx test` — 100% coverage on all four metrics
- [ ] `code-reviewer` run **before** closing coverage gaps
- [ ] `node common/scripts/install-run-rush.js rebuild` passes — a **new Rush project** changes the
      build graph, so this is not optional
- [ ] Change file for `@fgv/ts-agent-tasks`, verified against the integration branch
- [ ] `"sideEffects": false` in `package.json` — required for pure library packages, and T1's own
      acceptance says no side effects at import
- [ ] `CAPABILITIES.md` for the new package, plus its row in `.ai/instructions/LIBRARY_CAPABILITIES.md`
      — a CI gate (`verify-capability-docs.mjs`) enforces the index's shape and every reflex in it
- [ ] `verify-esm-entrypoints.mjs`, `verify-bundler-resolution.mjs` and `verify-tarball-exports.mjs`
      pass — a **new package** is exactly what these gates exist to catch, and they are invisible to
      the local build/test loop

## Known traps

- **The change-file gate is CI's first check and is invisible locally.** `rush change --verify`
  keys off *files touched*, not surface changed.
- **A new package must declare its exports correctly or three CI gates fail** in ways no local
  command reproduces. `verify-bundler-resolution` actually bundles each browser entry with esbuild
  at `platform: 'browser'` with node builtins **unpolyfilled**. If T1 is pure (it should be), this
  is free — but only if `package.json` is right.
- **`LIBRARY_CAPABILITIES.md` is `@`-included into every session**, so its size is paid on every
  task. The index routes; detail belongs in the package's own `CAPABILITIES.md`. One line.
- **Never `any`.** Hostile/malicious shape inputs in tests are `unknown`, per the plan's own test
  direction.

## Open design question — not T1's to answer, but do not let it leak in

Does terminal presentation dereference an executor-owned payload after the broker update is
retained or acknowledged? If it may, executor cleanup can leave a dangling stable reference. It is
a **§8.3 / T6 / T8** decision (raised by CodeRabbit on #681, withdrawn there as out of scope, and
carried to the design authority). T1 must not encode either answer into a type. If a T1 type seems
to require one, **stop and surface it** — that is the signal the question has reached this slice
early.

## Downstream

**T3** (FileTree records, durable commit, reopen) depends on T1 and F2, and F2 is shipped — so T1
is the only thing standing between the plan and a durable task path. **T2** (pure context,
snapshot-only) depends on T1 alone and is the first coherent consumer-facing unit. Everything else
is downstream of those.

Durability, when T3 arrives, is **Linux-only** and decided per root by filesystem identification —
overlayfs (a container's writable layer) is refused; a named volume, Linux bind mount or tmpfs
qualifies. See `implementation-plan.md` § *A1 amendment*.

## Required reading, in order

1. `docs/design/agent-tasks/implementation-plan.md` § *T1* — deliverables, acceptance, tests,
   review gate. The authority for this slice.
2. `docs/design/agent-tasks/development-design.md` — the engineering contract; §8.6 for the A3
   capacity model T1 must schematize.
3. `docs/design/agent-tasks/fgv-library.md` — scope and task model: what the library is and,
   importantly, what it refuses to be.
4. `docs/design/agent-tasks/deferred.md` — what is deliberately out, and the rule that "a
   correctness requirement cannot be labelled future work while advertising the guarantee it would
   make true."
5. `.ai/instructions/CODING_STANDARDS.md` § *Pre-PR Validation Checklist* — the change-file gate
   and the repo-wide rebuild rule.
6. An existing pure library for scaffold shape — `libraries/ts-prompt-assist/` is the most recent
   new package and the closest model.

## Missing-input rule

If any required-reading file does not exist, or any statement in this brief does not match what you
find in the tree, **STOP and surface the gap**. Do not reconstruct missing context by inference.
This applies especially to the plan's T1 section: if it does not say what this brief says it says,
the brief is wrong and the orchestrator wants to know before you build on it.
