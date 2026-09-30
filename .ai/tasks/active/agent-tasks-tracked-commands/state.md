# State — `agent-tasks-tracked-commands`

**Status:** brief written, not started. Awaiting the I1c landing before the branch is cut.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-tracked-commands/brief.md` — complete |
| branch | **not yet cut.** `claude/agent-tasks-tracked-commands` off `integration/agent-tasks-v1` at the I1c landing |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

## Why this stream exists

I1c ships command tools generated from the kind registry, but `fgv.tracked@1` registers **no
commands** — its eleven transitions have converters and no `JsonSchema`. So a model can create and
edit a tracked task (I1b) but cannot move its lifecycle. I1c routed this as a P3 with "a consumer
that wants a model to drive a tracked task's lifecycle" as the trigger; **the user chose to fix it
proactively instead** (2026-09-30), so it is a designed slice, not debt repayment.

`trackedTaskDescriptor()`'s own docstring already anticipated this: the command names are vocabulary
T1 owns, and *"their parameter schemas belong to the slice that implements the transitions they
name."* This is that slice.

## What is already built (verified, do not rebuild)

- `broker/commands.ts` → `_prepare` accepts native tracked commands, validates the name against
  `trackedTaskCommandNames`, converts through `trackedCommand`, refuses a stale `expectedRevision`;
  `evaluateTrackedCommand` / `commitTrackedCommand` apply it.
- `broker/reads.ts` reports `availableTrackedCommands`, which `task_inspect` surfaces.
- I1c's generator builds a tool per `ITaskCommandToolSpec` from the registry.

Missing: the registrations themselves.

## The open decision

**`_prepare` never consults the registry** — it validates with `core.converters.broker.trackedCommand`
directly. Registering schemas therefore creates two validation paths with **no runtime cross-check**
(weaker than the external case, where `createTaskCommandHandle` checks that the encoded form
re-validates). Either accept a pure fixture obligation, per the `detailSchema` precedent, or unify
`_prepare` onto the registered handle. Set out in the brief; undecided on purpose.

## Parallelism

Runs alongside **I1d**, which owns `packlets/tools/` and `fixedTaskToolNames`. This stream must touch
neither. Needing a tools change is a collision to surface, not a scope to take.

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing is implemented.
