[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceReplayEnvelope

# Interface: ISourceReplayEnvelope

The finite remaining required-update envelope a `source-replay` adapter must declare
and honor at admission.

## Remarks

Finite storage cannot reserve an unbounded sequence of required external events. The
envelope is what makes the stronger guarantee reservable: it states how many further
required updates, and how many encoded bytes, remain before the accepted work reaches
a terminal state, *including* replay needed during recovery. Extending it is new
admission; completion of already-accepted work must never depend on that extension.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-remainingrequiredbytes"></a> `remainingRequiredBytes` | `readonly` | `number` |
| <a id="property-remainingrequiredupdates"></a> `remainingRequiredUpdates` | `readonly` | `number` |
