[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDeferredObligationKey

# Interface: IDeferredObligationKey

What identifies one deferred obligation: the change it is owed for, as the host names it, and
which of that change's recipients it is owed to.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-changeref"></a> `changeRef` | `readonly` | `string` | The host's name for the change — an identifier (`[A-Za-z0-9._:-]`, starting alphanumeric). |
| <a id="property-role"></a> `role` | `readonly` | `string` | One of the helper's declared roles. |
