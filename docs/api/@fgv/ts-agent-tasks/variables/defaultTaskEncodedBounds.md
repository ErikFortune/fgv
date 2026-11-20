[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / defaultTaskEncodedBounds

# Variable: defaultTaskEncodedBounds

> `const` **defaultTaskEncodedBounds**: [`ITaskEncodedBounds`](../interfaces/ITaskEncodedBounds.md)

The default encoded-size maxima.

## Remarks

`maxUpdateBytes` (64 KiB) is a bound on what storage accepts, not the size an update can reach.
An update carries one envelope, bounded by `maxEnvelopeBytes`, plus fixed framing, so under
these defaults no update can exceed **37,417 bytes** — see `maximumUpdateBytes`, which every
forward reservation uses instead. Lowering `maxUpdateBytes` to that figure is left undone on
purpose: a stored limit cannot be raised back once lowered, and the reservations no longer
depend on it.
