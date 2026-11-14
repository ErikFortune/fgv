[**@fgv Monorepo API Documentation**](../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../README.md) / [@fgv/ts-extras](../../README.md) / AsyncControl

# AsyncControl

Control for asynchronous work: stop conditions — a deadline and a caller signal, raced against the
work so that work which ignores its signal still cannot hold its caller — and a write gate that
stops or holds every write routed through it.

## Classes

- [WriteGate](classes/WriteGate.md)

## Interfaces

- [IStopConditions](interfaces/IStopConditions.md)
- [IWriteGateOptions](interfaces/IWriteGateOptions.md)
- [IWriteGatePause](interfaces/IWriteGatePause.md)

## Type Aliases

- [CancelTimer](type-aliases/CancelTimer.md)
- [ScheduleTimer](type-aliases/ScheduleTimer.md)
- [StopDetail](type-aliases/StopDetail.md)
- [StopReason](type-aliases/StopReason.md)
- [WriteGatePauseFailure](type-aliases/WriteGatePauseFailure.md)
- [WriteGateRefusal](type-aliases/WriteGateRefusal.md)

## Variables

- [MAX\_DEADLINE\_MS](variables/MAX_DEADLINE_MS.md)

## Functions

- [raceStopConditions](functions/raceStopConditions.md)
