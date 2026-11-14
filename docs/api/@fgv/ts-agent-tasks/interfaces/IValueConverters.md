[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IValueConverters

# Interface: IValueConverters

The bounded value converters shared by the envelope, source and command surfaces.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-lifecycle"></a> `lifecycle` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TaskLifecycle`](../type-aliases/TaskLifecycle.md)\> |
| <a id="property-observationhealth"></a> `observationHealth` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ObservationHealth`](../type-aliases/ObservationHealth.md)\> |
| <a id="property-outcome"></a> `outcome` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskOutcome`](ITaskOutcome.md)\> |
| <a id="property-progress"></a> `progress` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskProgress`](ITaskProgress.md)\> |
| <a id="property-reason"></a> `reason` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskReason`](ITaskReason.md)\> |
| <a id="property-recoverydeclaration"></a> `recoveryDeclaration` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`RecoveryDeclaration`](../type-aliases/RecoveryDeclaration.md)\> |
| <a id="property-recoveryresult"></a> `recoveryResult` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`RecoveryResult`](../type-aliases/RecoveryResult.md)\> |
| <a id="property-reference"></a> `reference` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskReference`](ITaskReference.md)\> |
| <a id="property-references"></a> `references` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`ITaskReference`](ITaskReference.md)[]\> |
| <a id="property-responsibility"></a> `responsibility` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResponsibility`](IResponsibility.md)\> |
| <a id="property-scope"></a> `scope` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskScope`](ITaskScope.md)\> |
| <a id="property-scopes"></a> `scopes` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`ITaskScope`](ITaskScope.md)[]\> |
| <a id="property-sourcebinding"></a> `sourceBinding` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISourceBinding`](ISourceBinding.md)\> |
| <a id="property-sourcehistorydeclaration"></a> `sourceHistoryDeclaration` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SourceHistoryDeclaration`](../type-aliases/SourceHistoryDeclaration.md)\> |
| <a id="property-sourceprojection"></a> `sourceProjection` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISourceProjection`](ISourceProjection.md)\> |
| <a id="property-sourcereplayenvelope"></a> `sourceReplayEnvelope` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISourceReplayEnvelope`](ISourceReplayEnvelope.md)\> |
| <a id="property-sourcerevision"></a> `sourceRevision` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISourceRevision`](ISourceRevision.md)\> |
| <a id="property-stoppolicy"></a> `stopPolicy` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ParentStopPolicy`](../type-aliases/ParentStopPolicy.md)\> |
| <a id="property-waitingreason"></a> `waitingReason` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IWaitingReason`](IWaitingReason.md)\> |
