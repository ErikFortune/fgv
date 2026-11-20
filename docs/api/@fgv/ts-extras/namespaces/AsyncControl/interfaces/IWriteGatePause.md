[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AsyncControl](../README.md) / IWriteGatePause

# Interface: IWriteGatePause

A pause held on a `WriteGate`. Writes stay held until every held pause is resumed.

## Methods

### resume()

> **resume**(): `void`

Ends this pause. Idempotent: a second call does nothing, and never ends another pause.

#### Returns

`void`
