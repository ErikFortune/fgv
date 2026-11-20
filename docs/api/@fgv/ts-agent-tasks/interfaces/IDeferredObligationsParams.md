[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDeferredObligationsParams

# Interface: IDeferredObligationsParams

Parameters for [DeferredObligations.create](../classes/DeferredObligations.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-authorization"></a> `authorization` | `readonly` | [`ITaskAuthorization`](ITaskAuthorization.md) | The policy every read and write is authorized against. For a trusted host principal acting on its own obligations, `trustedKindAuthority` over [IDeferredObligationsParams.scope](#property-scope) is the way to get one — with `scopeMatch: 'some'` when deferrals carry instance scopes beside it. |
| <a id="property-broker"></a> `broker` | `readonly` | [`TaskBroker`](../classes/TaskBroker.md) | - |
| <a id="property-codes"></a> `codes?` | `readonly` | `Partial`\<[`IDeferredObligationCodes`](IDeferredObligationCodes.md)\> | - |
| <a id="property-converters"></a> `converters?` | `readonly` | [`TaskConverters`](../classes/TaskConverters.md) | The converters whose bounds the repository uses. Defaults to the default bounds. |
| <a id="property-guard"></a> `guard?` | `readonly` | [`ITaskHostWriteGuard`](ITaskHostWriteGuard.md) | The gate every obligation write passes through; see [ITaskHostWriteGuard](ITaskHostWriteGuard.md). |
| <a id="property-idprefix"></a> `idPrefix` | `readonly` | `string` | The prefix of every obligation's task id: an identifier with no `:`. |
| <a id="property-namespaces"></a> `namespaces?` | `readonly` | `Partial`\<[`IDeferredObligationNamespaces`](IDeferredObligationNamespaces.md)\> | - |
| <a id="property-operationbudget"></a> `operationBudget?` | `readonly` | `number` | The repository's per-task operation limit (`profile.perOwner.maxOperationsPerTask`). Defaults to `defaultTaskPerOwnerLimits`'; pass the repository's own when its profile differs. |
| <a id="property-principal"></a> `principal` | `readonly` | `string` | The principal every obligation write is recorded under. |
| <a id="property-roles"></a> `roles` | `readonly` | readonly `string`[] | The recipient roles an obligation can be owed to — identifiers with no `:`, unique, at least one. |
| <a id="property-schedule"></a> `schedule?` | `readonly` | `Partial`\<[`IDeferralSchedule`](IDeferralSchedule.md)\> | - |
| <a id="property-scope"></a> `scope` | `readonly` | [`ITaskScope`](ITaskScope.md) | The scope every obligation carries; every listing selects by it. |
