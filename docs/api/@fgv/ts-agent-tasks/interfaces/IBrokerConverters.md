[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBrokerConverters

# Interface: IBrokerConverters

Converters for the broker's requests, receipts and projected values.

## Remarks

Every request converter is strict. None has a principal or scope member for a caller to fill
in, so a fabricated `principal` or `scopes` property is a conversion failure rather than an
ignored field.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-archive"></a> `archive` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskMutationIdentity`](ITaskMutationIdentity.md)\> | - |
| <a id="property-boundduequery"></a> `boundDueQuery` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IBoundTaskDueQuery`](IBoundTaskDueQuery.md)\> | A bound view's due query: the bound query's members plus a `cutoff` instant. |
| <a id="property-boundquery"></a> `boundQuery` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IBoundTaskQuery`](IBoundTaskQuery.md)\> | - |
| <a id="property-changescopes"></a> `changeScopes` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IChangeTaskScopes`](IChangeTaskScopes.md)\> | - |
| <a id="property-commandresolution"></a> `commandResolution` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICommandResolutionRequest`](ICommandResolutionRequest.md)\> | A pass of the uncertain-command pump. |
| <a id="property-completelist"></a> `completeList` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICompleteTaskList`](ICompleteTaskList.md)\> | - |
| <a id="property-createlist"></a> `createList` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICreateTaskList`](ICreateTaskList.md)\> | - |
| <a id="property-createtracked"></a> `createTracked` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICreateTrackedTask`](ICreateTrackedTask.md)\> | - |
| <a id="property-listcompletion"></a> `listCompletion` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IListCompletionRequest`](IListCompletionRequest.md)\> | - |
| <a id="property-mutationidentity"></a> `mutationIdentity` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskMutationIdentity`](ITaskMutationIdentity.md)\> | - |
| <a id="property-mutationresult"></a> `mutationResult` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskMutationResult`](ITaskMutationResult.md)\> | - |
| <a id="property-principalkey"></a> `principalKey` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\> | A principal key: the bounded, single-line identity stored with operation evidence. |
| <a id="property-projectedenvelope"></a> `projectedEnvelope` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IProjectedTaskEnvelope`](../type-aliases/IProjectedTaskEnvelope.md)\> | A projected envelope: strict, with no `binding` member. |
| <a id="property-projectedreference"></a> `projectedReference` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IProjectedUnresolvedReference`](../type-aliases/IProjectedUnresolvedReference.md)\> | - |
| <a id="property-reassign"></a> `reassign` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReassignTask`](IReassignTask.md)\> | - |
| <a id="property-reassignmentresult"></a> `reassignmentResult` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReassignmentResult`](IReassignmentResult.md)\> | - |
| <a id="property-reconcile"></a> `reconcile` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISourceReconcileRequest`](ISourceReconcileRequest.md)\> | A request to reconcile one source. |
| <a id="property-registerexternal"></a> `registerExternal` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRegisterExternalTask`](IRegisterExternalTask.md)\> | - |
| <a id="property-reparent"></a> `reparent` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReparentTask`](IReparentTask.md)\> | - |
| <a id="property-trackedcommand"></a> `trackedCommand` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TrackedCommand`](../type-aliases/TrackedCommand.md)\> | `{ command, parameters }` for one `fgv.tracked@1` command. |
| <a id="property-updatetracked"></a> `updateTracked` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IUpdateTrackedTask`](IUpdateTrackedTask.md)\> | - |
