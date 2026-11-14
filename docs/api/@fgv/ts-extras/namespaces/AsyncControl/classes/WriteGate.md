[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AsyncControl](../README.md) / WriteGate

# Class: WriteGate

A cooperative gate for writes: one switch that every write routed through it consults, so a
host can stop them all, or hold them still for a moment, without a close per store.

## Remarks

**Three states.**
- **Open** — a guarded write runs at once.
- **Paused** — while at least one pause is held, a new write waits and runs once the last pause
  is resumed. `pause` resolves when the writes already under way have finished, so the caller
  then holds a moment in which nothing guarded is writing.
- **Raised** — a new write is refused without running, and so is every write waiting on a pause:
  they are woken and refused at once. Writes already under way are not interrupted; the gate is
  cooperative and only decides whether a write *starts*. `lower` reopens it.

Raised wins over paused. Lowering does not resume a pause, and resuming does not lower.

**When a write is admitted.** The decision — refuse, wait, or run — is made synchronously inside
`guard`, and a write that runs is counted in `inFlight` before `write` is called. So a `pause` or
`raise` made after `guard` returns always sees that write; one made before it is always seen by
it. A write woken from a pause decides again, so a pause taken between the wake and the write's
turn holds it once more.

**Order is kept.** Every write takes a sequence number when it first calls `guard`, and the
waiting list is kept in that order, so writes held by a pause start in the order they asked. A
write that is woken and then held again — a pause taken before its turn — keeps its original
place rather than going to the back, and a write that asks while earlier ones are still waiting
or being woken waits behind them rather than overtaking them.

**What a guarded write answers.** The write's own result, passed through as the same object.
A write that throws synchronously, rejects, or resolves to something that is not a `Result` is
answered as a failure (`'threw'`), never as a rejection or a raw value. The `inFlight` slot is released on every path — success, failure, throw, rejection —
before the guard's own result settles.

**Call-site rule: a guarded write must not call `guard` on the same gate.** While the gate is
open that merely nests, but against a pause it deadlocks: the pause waits for the outer write,
which waits for the inner one, which waits for the pause. The gate cannot tell a nested call
from a concurrent caller's without an async context, and the only one available is Node-only
(`AsyncLocalStorage`) while this packlet also runs in the browser — so the nesting itself is not
refused. The deadlock it causes is bounded and classified instead: the pause times out, is
withdrawn, releasing the waiting writes, and fails `'stalled'`.

Nothing here is Node-only; time is used only through the injectable `schedule`.

## Accessors

### inFlight

#### Get Signature

> **get** **inFlight**(): `number`

How many guarded writes are under way.

##### Returns

`number`

***

### quiet

#### Get Signature

> **get** **quiet**(): `boolean`

Whether no guarded write is under way. Writes waiting on a pause are not under way.

##### Returns

`boolean`

***

### waiting

#### Get Signature

> **get** **waiting**(): `number`

How many guarded writes are waiting for a pause to end.

##### Returns

`number`

## Methods

### check()

> **check**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Succeeds while the gate is lowered; fails with the reason while it is raised.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

#### Remarks

A moment, not a reservation: a write guarded after a successful `check` is still refused if the
gate is raised in between. Use `guard` to make the decision and the write one step.

***

### guard()

> **guard**\<`T`\>(`write`): [`AsyncResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Runs `write` through the gate: refused while it is raised, held while it is paused, and
counted in `inFlight` while it runs.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `write` | [`AsyncDeferredResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> | The write. Called at most once, and only if the gate admits it. |

#### Returns

[`AsyncResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

The write's own result; a refusal or a throw is a failure.

***

### guardDetailed()

> **guardDetailed**\<`T`, `TD`\>(`write`): [`AsyncDetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`WriteGateRefusal`](../type-aliases/WriteGateRefusal.md) \| `TD`\>

`guard` for a write that answers a detailed result. A refusal or a throw carries a
`WriteGateRefusal` as its detail; the write's own result passes through.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` |
| <a id="type-parameter-td"></a> `TD` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `write` | () => `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TD`\>\> | The write. Called at most once, and only if the gate admits it. |

#### Returns

[`AsyncDetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`WriteGateRefusal`](../type-aliases/WriteGateRefusal.md) \| `TD`\>

The write's own result, or a failure detailed with why the gate answered instead.

***

### lower()

> **lower**(): `void`

Lowers the gate. A pause that is held stays held.

#### Returns

`void`

***

### pause()

> **pause**(`timeoutMs`): [`AsyncDetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IWriteGatePause`](../interfaces/IWriteGatePause.md), [`WriteGatePauseFailure`](../type-aliases/WriteGatePauseFailure.md)\>

Holds every write that has not started, and waits — for at most `timeoutMs` — for the writes
under way to finish.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `timeoutMs` | `number` | The longest wait, an integer in `0 ≤ ms ≤ 2^31-1`; anything else is refused (`'invalid'`) and nothing is paused. |

#### Returns

[`AsyncDetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IWriteGatePause`](../interfaces/IWriteGatePause.md), [`WriteGatePauseFailure`](../type-aliases/WriteGatePauseFailure.md)\>

The held pause, to resume.

#### Remarks

Writes are held from the moment `pause` is called, not from when it resolves. Pauses nest:
writes go ahead once every held pause is resumed. A pause that does not reach quiet in time is
withdrawn — holding nothing — and fails `'timeout'`, or `'stalled'` when writes were waiting on
it. Once a pause has succeeded nothing times it out; it holds until it is resumed.

***

### raise()

> **raise**(`reason`): `void`

Raises the gate: every write guarded from now on is refused without running, and every write
waiting on a pause is woken and refused. Writes under way are not interrupted. Raising again
replaces the reason.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reason` | `string` | Why, carried in every refusal. |

#### Returns

`void`

***

### create()

> `static` **create**(`options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`WriteGate`\>

Creates an open gate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IWriteGateOptions`](../interfaces/IWriteGateOptions.md) | The timer seam. A `schedule` that is not a function is refused. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`WriteGate`\>

The gate.
