[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IProjectedTaskEnvelope

# Type Alias: IProjectedTaskEnvelope

> **IProjectedTaskEnvelope** = `Omit`\<[`ITaskEnvelope`](../interfaces/ITaskEnvelope.md), `"binding"`\>

A task envelope as a bound view presents it.

## Remarks

There is no `binding` member: a view has no way to emit a source binding at all, whatever its
projector returns — the projected value is strictly converted, and an extra property fails the
call. Outcome artifact references are removed by the default projector.
