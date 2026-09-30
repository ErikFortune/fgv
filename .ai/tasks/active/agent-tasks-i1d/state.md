# State — `agent-tasks-i1d`

**Status:** brief written, not started. Awaiting the I1c landing before the branch is cut.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-i1d/brief.md` — complete |
| branch | **not yet cut.** `claude/agent-tasks-i1d` off `integration/agent-tasks-v1` at the I1c landing |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

**This slice closes I1.**

## Predecessors

I1a (#702) the packlet and read-only surface; I1b (#703) the mutation opt-ins, `task_inspect.revision`,
`toolSupport.ts`, `writerAnswers.ts`; I1c (#704) generated command tools, `ITaskCommandHandle.parameters`,
`fixedTaskToolNames`. Binding members reached so far: six — `query`, `inspect`, `execute`,
`createTracked`, `updateTracked`, `reassign`.

## Open decisions this slice must take

1. **Per stop operation, may a model reach it?** `inspectStop` is a *read* on `IBoundTaskView` (I1a
   left it deliberately unused); `requestStop`, `releaseStop` and `reconcileStop` are writer
   operations. `reconcileStop` is the host's pump and performs effects — I1c excluded
   `resolveCommands` for that reason. `releaseStop` un-freezes admission. Concluding some must not be
   model-reachable is a shipped property, not a gap.
2. **`intentId` disclosure.** `IReleaseStop` and `IStopInspectRequest` need one, and it is an
   `OperationId` — which I1b and I1c both deliberately withhold from the model.
3. **The `stop-active` coherence question I1c deferred here.** I1c maps `stop-active` to `conflict`
   precisely so a refusal does not say a stop exists, and its `result.md` says that is I1d's to
   disclose. Either keep `conflict` always, or disclose when stop tools are enabled — the second
   makes one tool's output depend on which other tools the host enabled.
4. **Bounding `targets`** (unbounded length; every other tool in the packlet bounds its output) and
   whether `capacity?: ICapacityFailure` reaches the model at all.

T9 already did the principal-level projection: `IProjectedStopTarget` omits `stableSourceEvidence`,
`targets` lists only readable targets, and `restrictedWorkRemains` reports an unconfirmed invisible
target without counts or identities. The remaining work is model-facing.

## Known mechanical obligation

`fixedTaskToolNames` (`packlets/tools/commandTools.ts:51`) must gain this slice's stop tool names.
`factory.test.ts:610` pins that list against the names the factory builds with everything enabled, so
that test fails until it is updated — verified, not assumed.

## Parallelism

Runs alongside **`agent-tasks-tracked-commands`**, which owns `converters/builtinKinds.ts`,
`types/trackedCommands.ts` and possibly `broker/commands.ts`. **This stream owns `packlets/tools/` and
`fixedTaskToolNames`**; neither stream touches the other's files. A collision is to be surfaced.

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing is implemented.
