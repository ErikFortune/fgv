[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskWriteGuard

# Interface: ITaskWriteGuard

Wraps every write a broker makes — a cooperative write gate a host supplies to
`TaskBroker.create`.

## Remarks

Structural, so any host gate with this shape fits — including `AsyncControl.WriteGate` from
`@fgv/ts-extras`, whose `guard` answers an `AsyncResult` over a plain `Result`. `guard` is given
the broker's whole writer section and calls it at most once. The broker tracks whether it did:

- **Not called.** A failure the gate returns is the operation's result when its detail is a valid
  task failure; any other failure (a gate typed over plain `Result`) is reported as
  `storage-unavailable`, retry `after-host-action`, since nothing was written. A gate that
  answers success or something that is not a `Result` without calling the section, or throws,
  is `invalid`.
- **Called.** The section's own result is the operation's result when the gate returns it, or
  any success. When the gate then fails, throws or answers something that is not a `Result` —
  or the section itself rejects — the operation is `storage-unavailable`, retry
  `reconcile-first`: the section may have committed. A section the gate started without awaiting
  is awaited before the broker's turn ends.
- **Called twice.** The second call is refused without running (`invalid`).
- **Called after the broker observed the gate's answer.** Refused without running (`invalid`): it
  would run outside the broker's turn. The broker observes the answer a few microtasks after it
  settles; a section started inside that window is awaited and classified as called, so
  `reconcile-first` unless the gate answered its result. A gate may wait — on a pause, say —
  before starting it, as long as it starts it before answering.

**The gate must not call the broker.** A broker operation started from inside `guard` queues
behind the very section the gate is holding and never runs, and every later broker write queues
behind both. The broker cannot tell such a call from a concurrent caller's without an async
context the library does not assume, so it is not detected; `TaskBroker.whenIdle` from inside the
gate is the one safe call — it does not queue — and times out, since the gate's own section is
busy.

## Methods

### guard()

> **guard**\<`T`\>(`write`): `PromiseLike`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\>

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `write` | () => `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<`T`\>\> |

#### Returns

`PromiseLike`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\>
