[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITrustedKindAuthorityParams

# Interface: ITrustedKindAuthorityParams

Parameters for [trustedKindAuthority](../functions/trustedKindAuthority.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-actions"></a> `actions` | `readonly` | readonly [`TaskAction`](../type-aliases/TaskAction.md)[] | The actions the authority permits. Required and never empty: there is no default of "all". |
| <a id="property-epoch"></a> `epoch` | `readonly` | `string` | The policy epoch the authority reports. It never changes: the answer never does. |
| <a id="property-kinds"></a> `kinds?` | `readonly` | readonly `string`[] | The task kinds the authority covers, matched exactly. Omitted: any kind. Never empty. |
| <a id="property-policyidentity"></a> `policyIdentity?` | `readonly` | `string` | The policy's identity (`ITaskAuthorization.policyIdentity`), when the host names it. |
| <a id="property-scopematch"></a> `scopeMatch?` | `readonly` | [`TrustedScopeMatch`](../type-aliases/TrustedScopeMatch.md) | How requested scopes are matched. Defaults to `'every'`. |
| <a id="property-scopes"></a> `scopes?` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] | The scopes the authority covers, matched by namespace and key. Never empty. Omitted: a request that only names a task is decided on its kind alone, and every request that asks for scopes — a creation, a subscription, a scope change — is refused, because there is no boundary to hold them to. |
