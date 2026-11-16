[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / createTaskTools

# Function: createTaskTools()

> **createTaskTools**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IAiClientTool`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`unknown`\>[]\>

Builds the task tools over a principal-bound view, ready to hand to
`AiAssist.executeClientToolTurn`: `task_query` and `task_inspect`, and — only when the host opts
in through `mutations` — `task_create`, `task_update` and `task_reassign`, and — only when it opts
in through `stops` — `task_stop` and `task_stop_inspect`, and — only when it opts in through
`commands` — one tool per registered command it names.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ICreateTaskToolsParams`](../interfaces/ICreateTaskToolsParams.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IAiClientTool`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`unknown`\>[]\>

## Remarks

**Read-only by default, with no mutation dependency.** Without `mutations`, `stops` or `commands`
the tools take an [IBoundTaskView](../interfaces/IBoundTaskView.md) and call only its `query` and `inspect`.

**Mutations are opt-in, and opting in authorizes nothing.** With `mutations`, each opted-in tool
calls one writer method — `createTracked`, `updateTracked` or `reassign` — and the writer's policy
decides every call when it runs. The model supplies no operation id and no new task id (the tool
mints both), no scope and no source binding. A change to an existing task carries the revision
`task_inspect` returned as its `expectedRevision`, and the writer refuses it if the task has moved
since. A writer's receipt is converted, and must be for the task and operation asked about, before
anything reads it; the model is told the task id, revision and disposition, never update ids.

**Commands are opt-in, typed by the registry, and never resent by the model.** Each offered command
is looked up in `commands.registry` when the tools are built, and its tool's wire schema carries the
command's registered parameter schema. A call is sent through the writer's `execute` with a minted
operation id, only to a task of the command's own kind and detail version; the model is told
`accepted` or `applied`, a refusal as a fixed code line (`denied` reads exactly as a missing task),
and otherwise that the outcome is not known and it must not send the command again — for a
`source-key` command the host's `resolveCommands` pump resends under the same key; a `none` command
is never resent — the pump resolves it through the source's lookup, or holds it until the host
abandons it. No text a source or host wrote reaches the model. A generated name may not be a fixed tool's, and two may not clash: the set is refused at
build time.

**Stops are opt-in, and a model may only apply them.** With `stops`, `task_stop` calls the writer's
`requestStop` for the modes offered, with a minted operation id that becomes the stop's `intentId`,
and `task_stop_inspect` calls the view's `inspectStop`. A stop is recorded and its tree frozen; the
host's `reconcileStop` pump carries it out, and only the host releases it — neither is a model tool.
Targets reach the model a page at a time (at most `budget.context.maxItems`), each as its id, state,
confirmed revision and any violation; never its command key, and never a capacity refusal, which goes
to `logger`. Every other tool answers a stop latch as `conflict`, as it does without the stop tools.

**Nothing the model supplies can widen what it sees.** Neither schema has a principal, scope or
consumer member, both are closed (a surplus property fails), and every `execute` re-validates its
arguments, since a direct call reaches it with no harness in front.

**Authority is live.** Building the tools calls nothing on the view; each call asks the view, and
the view asks the host's policy, then.

**Bounded by default.** Every task reaches the model as `TaskContextRenderer` text within
`budget.context`, never as a raw envelope; a page is at most `budget.context.maxItems` tasks;
details are returned only when their serialized text fits `budget.maxDetailsChars`, a budget independent of
the context text's. A projector that fails — the view's or the renderer's — fails the call:
nothing is returned in its place, and nothing falls back to a less-projected value.

**A failure tells the model a code, never host text.** A failure the view or the rendering
reports reaches the model as its code and a fixed description; the underlying message — which can
carry a projector's error, a storage detail or a thrown exception — goes only to `logger`. Only a
failure of the model's own arguments is described in full, cut at 500 characters.

**What is framed and what is not.** Task state reaches the model only inside the renderer's
framed, escaped context text. Details are task data too: they are returned beside the text as one
line of JSON whose every string is escaped exactly as the renderer escapes task prose
(`serializeTaskData`), so no invisible or frame-breaking character reaches the model raw.
