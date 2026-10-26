# State: `agent-tasks-host-helpers`

Worker-owned working surface. The brief is frozen; questions and interpretations live here.

Base: `origin/agent-tasks-host-helpers` @ `2b909e556` (brief commit over `integration/asks` @ `f4b57551e`).

## Interpretations taken (brief was silent or ambiguous)

1. **`scopeMatch`** — the brief lists it as an option with "see below", and below states the rules
   (named task → *some* of its scopes; create/subscribe → *every* requested scope). Read as: the knob
   that governs **requests carrying requested `scopes`** (create, subscribe, dispose-over-subscription,
   and the target scopes of a scope change), `'every'` by default — the stated rule — with `'some'`
   available for a host whose creations carry a per-instance scope beside the kind's (PersonAIlity's
   wake tasks carry `conversation:<id>` beside `kind:wake`, which `'every'` over `[kind:wake]` would
   refuse). A named task is always decided by *some* of its own scopes.
2. **A request carrying both a task and requested scopes** (a scope change) must pass both: the task
   by *some*, the requested scopes by `scopeMatch`. Otherwise a trusted authority over one scope
   could move a task out of it.
3. **A request naming no task needs `scopes` configured** on the authority. With `scopes` omitted
   there is no boundary to check a creation or subscription against, so it is denied rather than
   allowed by default. An empty requested-scope list is always denied (`every` of nothing is vacuous).
4. **B-7 split by kind.** Native pending registrations (`create-tracked`, `create-list`) resume
   through a bound writer, which re-authorizes `create`. A pending `register-external` has no
   authorization step to repeat (registration is a trusted host operation), so it resumes through
   `TaskBroker.resumePendingRegistration`, under the principal it was accepted for.
5. **Schedule type.** ts-extras `async-control` `ScheduleTimer` is not on `integration/asks`
   (it lives on the unmerged `ai-assist-client-tool-loop` branch), so the broker declares its own
   structurally identical `TaskScheduleTimer`. Flag for consolidation once both land.
6. **Manifest field** is `initializedMode?: 'session' | 'process-crash'` — a durability name rather
   than `TaskRepositoryMode`, because the manifest type lives in `types`, which may not import
   `storage`.

## Findings

- `releaseStale`: the repository exposes **no open generation**. `health().generation` starts at 0
  on every open and advances per commit, so it cannot tell a receipt issued by an earlier open from
  one issued by this one, and nothing persisted records an open count. Not built.
- A native pending entry does **not** store the creation scopes: they are the creating view's
  `creationScopes`, not part of the request. A resume therefore creates the task with the *resuming*
  view's creation scopes — the same as an identical retry through that view would.

## Progress

- [x] B-4 storage: exported probe, manifest field, open opt-in
- [x] host packlet: `trustedKindAuthority`, `openOrInitializeTaskRepository`
- [x] B-7 resume
- [x] B-5: `whenIdle`, `writeGuard`, `issued()`
- [x] docs, api.md, change files
- [x] gates
- [x] close-out
