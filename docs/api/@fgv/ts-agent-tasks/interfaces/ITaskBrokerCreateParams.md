[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskBrokerCreateParams

# Interface: ITaskBrokerCreateParams

Parameters for [TaskBroker.create](../classes/TaskBroker.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-converters"></a> `converters?` | `readonly` | [`TaskConverters`](../classes/TaskConverters.md) | Converters to validate requests with. Defaults to the default field bounds. |
| <a id="property-delivery"></a> `delivery?` | `readonly` | [`ITaskDeliveryDefaults`](ITaskDeliveryDefaults.md) | Defaults for new subscriptions and issued receipts. A subscription's policy is persisted when it is created: changing these later changes only subscriptions created after. (T7.) |
| <a id="property-environment"></a> `environment` | `readonly` | [`ITaskEnvironment`](ITaskEnvironment.md) | - |
| <a id="property-repository"></a> `repository` | `readonly` | [`ITaskRepository`](ITaskRepository.md) | The repository the broker mediates. One broker per repository: it owns the write ordering. |
| <a id="property-schedule"></a> `schedule?` | `readonly` | [`ScheduleTimer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) | The timer [TaskBroker.whenIdle](../classes/TaskBroker.md#whenidle) bounds its wait with. Defaults to `setTimeout`. |
| <a id="property-sources"></a> `sources?` | `readonly` | readonly [`ITaskSource`](ITaskSource.md)[] | The external sources this broker reconciles and dispatches to, each under a distinct id. A task whose source is not attached is left exactly as it is: its commands fail `source-unavailable` recording nothing, and no pass touches it. Creating the broker calls no source. |
| <a id="property-writeguard"></a> `writeGuard?` | `readonly` | [`ITaskWriteGuard`](ITaskWriteGuard.md) | A host write gate every broker write passes through — bound-writer operations, model tools, source passes, deliveries, retention and `cleanup` alike. It wraps each serialized writer section, inside the broker's writer queue, so a section the gate holds holds every section queued behind it. **Remarks** **A long hold fills the queue.** At most 64 sections wait for the writer; once that many are queued behind a held one, every further broker write fails at once with `conflict`, retry `safe`, until the hold ends. [TaskBroker.whenIdle](../classes/TaskBroker.md#whenidle) counts a held section as busy. A guard must call the section at most once, and before it answers: a call after the broker has observed its answer is refused without running, and one inside the few microtasks before that is awaited and classified as called. A guard that refuses without calling it, with a failure carrying no valid task detail, is `storage-unavailable` (retry `after-host-action`); one that answers success without calling it is `invalid`; one that fails or throws **after** calling it, or whose section rejects, is `storage-unavailable` with retry `reconcile-first`, because the section may have committed; a second call is refused without running. `AsyncControl.WriteGate` from `@fgv/ts-extras` fits as is. |
