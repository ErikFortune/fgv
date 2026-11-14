[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStoredTaskOperation

# Type Alias: IStoredTaskOperation

> **IStoredTaskOperation** = [`IStoredCommandOperation`](../interfaces/IStoredCommandOperation.md) \| [`IStoredCatalogOperation`](../interfaces/IStoredCatalogOperation.md)

One operation's dedup evidence, retained for the task's whole retained lifetime.

## Remarks

`request` is what a replay is compared against, canonically and in full. Storage never
drops an operation from a record once it is there — pruning applies to update payloads,
never to dedup evidence.
