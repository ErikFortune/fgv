# State — `agent-tasks-i2`

**Status:** brief written, not started.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-i2/brief.md` — complete |
| branch | `claude/agent-tasks-i2`, cut off `integration/agent-tasks-v1` at `e662da68c` |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

## Where this sits in the cluster

I1 is complete — all four slices plus the fifth `agent-tasks-tracked-commands` slice. The integration
branch holds T1–T9, I1a–I1d and the tracked registrations.

**Sequencing, from the plan:** I2 depends on T2, T7 and I1, all landed. **P1 lists I2 as a
dependency** (its journey step 9 resolves the final prompt with real prompt-assist composition), so
P1 waits on this. The **M1 stop-state cohort depends only on T9**, so it may run in parallel — its
surface is `perf/residentMemory.js` plus a result artifact, disjoint from `packlets/prompt/`.

## Open decisions this slice must take

1. **How an inclusion receipt is bound to the prompt that was sent**, so a changed or dropped task
   slot makes the receipt unacknowledgeable. Three candidate mechanisms are set out in the brief —
   bind to emitted text, bind to composition identity, or refuse to hand back an acknowledgeable
   receipt at all. **None is verified as buildable**; the brief says so explicitly, because the
   orchestrator's preferred option was wrong on both I1c and tracked-commands.
2. **Whether `task_inspect`'s details are data to be framed like task prose.** `docs/TECH_DEBT.md`
   carries this as a P3 with I2 as its named trigger, because prompt trust framing is I2's review
   gate. `quoteData` is internal to the `context` packlet, so framing them needs a new public
   primitive. Resolve or record as the design; the entry closes either way.

## Verified inputs (checked, not assumed)

- `toCacheRequest(composition, hints?) → Result<AiAssist.IAiCacheRequest>` and
  `analyzePromptCacheStability(params) → ReadonlyArray<IPromptCacheFinding>` are both public
  `ts-prompt-assist` exports (`etc/*.api.md`).
- `PromptCacheStability` is `'frozen' | 'per-conversation' | 'per-request'`.
- `quoteData` / `serializeRecord` live in `context/escaping.ts`; `framingReserve` is public on the
  renderer instance.
- `packlets/prompt/` does not exist yet.

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing is implemented.
