[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDeferredObligationCodes

# Interface: IDeferredObligationCodes

The lifecycle reason codes [DeferredObligations](../classes/DeferredObligations.md) writes.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-abandoned"></a> `abandoned` | `readonly` | `string` | The code a deferral interrupted between its create and its wait is cancelled under. |
| <a id="property-cancelled"></a> `cancelled` | `readonly` | `string` | The code an obligation is cancelled under when it is ended undelivered. |
| <a id="property-merged"></a> `merged` | `readonly` | `string` | The code an obligation is cancelled under when its changes were merged into another. |
| <a id="property-wait"></a> `wait` | `readonly` | `string` | The code an obligation waits under. |
