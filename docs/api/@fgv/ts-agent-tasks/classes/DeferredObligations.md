[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / DeferredObligations

# Class: DeferredObligations

Deferred obligations: durable retry obligations kept as `fgv.tracked@1` tasks that wait with a
`notBefore`, for a host with a busy recipient — a completion owed to a room with a turn open,
commit work owed to a store mid-snapshot.

## Remarks

**One obligation per change and role, by id.** An obligation's task id is
`<idPrefix>:<role>:<changeRef>` — deterministic, so a deferral replayed after a crash finds the
task it already created, and injective, so two roles for one change never share a task. The role
is in the id, not only in the wait reason, because a task left `pending` has no wait reason yet.

**A deferral is create, then wait.** A crash between the two leaves the task `pending`; a crash
inside the creation leaves a pending registration. [DeferredObligations.defer](#defer) replayed
finishes either: it resumes the registration from the request the repository stored, then sets
the task waiting. Every write carries an operation id derived from the task and the revision it
expects, so a write whose response was lost replays its stored receipt rather than applying twice.

**No timers.** [DeferredObligations.due](#due) answers what is due from the repository's due
index; the host's own passes drive retries. [DeferredObligations.retry](#retry) advises the next
step and writes nothing.

**Authorization is never bypassed.** Every read is a bound view's and every write a bound
writer's, under the principal and policy the host supplies.

Every write goes through the optional [ITaskHostWriteGuard](../interfaces/ITaskHostWriteGuard.md), one guarded unit per method
call; see it for how it composes with the broker's own `writeGuard`.

## Methods

### abandonPending()

> **abandonPending**(`before`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationSweep`](../interfaces/IDeferredObligationSweep.md)\<[`IDeferredObligationKey`](../interfaces/IDeferredObligationKey.md)\>\>\>

Ends and archives every obligation still `pending` — a deferral interrupted between its create
and its wait — that was created before `before` (epoch milliseconds), and answers the key of
each, so the host can record why that change will not be delivered to that role.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `before` | `number` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationSweep`](../interfaces/IDeferredObligationSweep.md)\<[`IDeferredObligationKey`](../interfaces/IDeferredObligationKey.md)\>\>\>

#### Remarks

Only tasks that are `pending` both when listed and when cancelled are touched: each cancel
carries the revision it was listed at, so one that a replayed deferral set waiting in between
is refused and reported as an issue, not ended. A pending obligation is finished only when its
change is deferred again, so one still pending long after its creation would otherwise hold its
reservation for good. Only tasks that read as this helper's obligations — an id it makes, kind
`fgv.tracked@1` — are considered; others are reported.

**A creation interrupted inside the repository** — a pending registration, accepted and never
marked live — is not swept here: it is not a task yet, and no bound view lists registrations.
`defer` replayed for its key resumes it; a host that will never replay it finds it in the trusted
`repository.outstanding()` report.

***

### archiveSettled()

> **archiveSettled**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationSweep`](../interfaces/IDeferredObligationSweep.md)\<[`TaskId`](../type-aliases/TaskId.md)\>\>\>

Archives every obligation that is settled but not yet archived — one whose archive did not land
after it was settled — which releases what it reserves. Answers the ids archived, and an issue
for each it could not. A terminal task in the helper's scope that is not one of its obligations —
an id it does not make, or another kind — is left alone and reported.

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationSweep`](../interfaces/IDeferredObligationSweep.md)\<[`TaskId`](../type-aliases/TaskId.md)\>\>\>

***

### cancel()

> **cancel**(`obligation`, `reason`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>\>

Ends `obligation` undelivered with `reason`, then archives it. Answers its task id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `obligation` | [`IDeferredObligation`](../interfaces/IDeferredObligation.md) |
| `reason` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>\>

***

### defer()

> **defer**(`deferral`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DeferOutcome`](../type-aliases/DeferOutcome.md)\>\>

Records that `deferral.key`'s change is owed later: the obligation's task is created, then set
waiting until `deferral.notBefore`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deferral` | [`IDeferral`](../interfaces/IDeferral.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DeferOutcome`](../type-aliases/DeferOutcome.md)\>\>

#### Remarks

Idempotent per change and role. An obligation already waiting is answered as it is; one left
`pending`, or as a pending registration, by an interrupted deferral is finished now; one already
settled answers its terminal status — the host then only needs to finish whatever it was
deferring for, and the status says whether the obligation was discharged (`succeeded`) or ended
without it (`cancelled`).

A `pending` task under the obligation's id is finished only when it **looks like** one this
helper would have created: a `fgv.tracked@1` task carrying exactly the set of the helper's scope
and `deferral.scopes`. A list, or a task with other scopes, is refused, never adopted.

**What is not checked: who created it.** Neither the envelope nor a bound view exposes the
creating principal, so a `pending` tracked task with the expected scopes is adopted whoever
created it. The boundary is the authorization policy: only a principal the policy lets `create`
in the helper's scope can put a task there, so grant that to the host's own principal alone.

`deferral.scopes` may not repeat a scope or name the helper's own: refused before anything is
read.

***

### due()

> **due**(`now`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationListing`](../interfaces/IDeferredObligationListing.md)\>\>

The waiting obligations due at `now` (epoch milliseconds), oldest `notBefore` first — from the
repository's due index, never a scan.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `now` | `number` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationListing`](../interfaces/IDeferredObligationListing.md)\>\>

***

### firstNotBefore()

> **firstNotBefore**(`now`): `number`

When an obligation deferred at `now` (epoch milliseconds) is first due: after the first backoff.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `now` | `number` |

#### Returns

`number`

***

### keyOf()

> **keyOf**(`taskId`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationKey`](../interfaces/IDeferredObligationKey.md)\>

The key a task id names — the inverse of [DeferredObligations.taskIdFor](#taskidfor).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationKey`](../interfaces/IDeferredObligationKey.md)\>

***

### merged()

> **merged**(`obligation`, `into`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>\>

Ends `obligation` as merged into `into`, which already owes its changes, then archives it.
Nothing was discharged through `obligation`, so it is cancelled — under the `merged` code, with
a reference to `into` — rather than succeeded. `into` is read again first, and the merge fails,
writing nothing, unless it is waiting now, is owed to the **same role**, and owes every change
`obligation` does: merge the changes into `into` first, with [DeferredObligations.wait](#wait).
Two roles are two obligations; one is never discharged through the other.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `obligation` | [`IDeferredObligation`](../interfaces/IDeferredObligation.md) |
| `into` | [`IDeferredObligation`](../interfaces/IDeferredObligation.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>\>

***

### retry()

> **retry**(`obligation`, `now`): [`DeferralDecision`](../type-aliases/DeferralDecision.md)

Advises the next step for `obligation`, found undischarged at `now` (epoch milliseconds).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `obligation` | [`IDeferredObligation`](../interfaces/IDeferredObligation.md) |
| `now` | `number` |

#### Returns

[`DeferralDecision`](../type-aliases/DeferralDecision.md)

#### Remarks

The backoff is the obligation's age, within `baseMs` and `capMs`: each retry waits as long as
the obligation has existed, which doubles the interval at every retry without counting
anything. Below the cap the next `notBefore` is written (`wait`); at the cap, or with no waits
left in the task's operation budget, it is held in memory (`hold`) — a busy recipient at a
five-minute cap would otherwise spend a task's whole operation budget in a few hours. Past
`maxDeferralMs` it is `expire`. Pure: it reads and writes nothing.

***

### stateOf()

> **stateOf**(`key`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DeferredObligationState`](../type-aliases/DeferredObligationState.md)\>\>

What the repository holds for the obligation `key` names.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | [`IDeferredObligationKey`](../interfaces/IDeferredObligationKey.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DeferredObligationState`](../type-aliases/DeferredObligationState.md)\>\>

***

### succeed()

> **succeed**(`obligation`, `summary`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>\>

Settles `obligation` as discharged, saying how, then archives it. Answers its task id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `obligation` | [`IDeferredObligation`](../interfaces/IDeferredObligation.md) |
| `summary` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>\>

***

### taskIdFor()

> **taskIdFor**(`key`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>

The deterministic task id of the obligation `key` names: `<idPrefix>:<role>:<changeRef>`.
Fails for an undeclared role, or a change ref that does not make an id within bounds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | [`IDeferredObligationKey`](../interfaces/IDeferredObligationKey.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>

***

### wait()

> **wait**(`obligation`, `notBefore`, `change?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligation`](../interfaces/IDeferredObligation.md)\>\>

Sets `obligation` waiting again until `notBefore` (epoch milliseconds) — the next backoff, or a
merge that gives it other obligations' changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `obligation` | [`IDeferredObligation`](../interfaces/IDeferredObligation.md) |
| `notBefore` | `number` |
| `change?` | [`IDeferredObligationWait`](../interfaces/IDeferredObligationWait.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligation`](../interfaces/IDeferredObligation.md)\>\>

#### Remarks

Refused, writing nothing, when it has no waits left ([IDeferredObligation.waitsRemaining](../interfaces/IDeferredObligation.md#property-waitsremaining)):
the task's operation budget is spent but for its closeout, and the host holds the retry in
memory instead. A wait identical to the current one writes nothing and answers the obligation as
it is. A task that moved since it was read fails on its revision.

***

### waiting()

> **waiting**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationListing`](../interfaces/IDeferredObligationListing.md)\>\>

Every waiting obligation, due or not.

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDeferredObligationListing`](../interfaces/IDeferredObligationListing.md)\>\>

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`DeferredObligations`\>

Creates the helper. Fails when the prefix or a role is not an identifier without `:`, the roles
are empty or repeat, two codes or namespaces coincide, the schedule is not ordered
`0 < baseMs <= capMs <= maxDeferralMs`, the operation budget leaves no room for a wait, or the
broker refuses the binding.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IDeferredObligationsParams`](../interfaces/IDeferredObligationsParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`DeferredObligations`\>
