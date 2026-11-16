[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / FRAGMENT\_NARROWING\_INCOMPLETE\_MESSAGE

# Variable: FRAGMENT\_NARROWING\_INCOMPLETE\_MESSAGE

> `const` **FRAGMENT\_NARROWING\_INCOMPLETE\_MESSAGE**: `string` = `` 'fragment recall: `entityId` and `kind` must be supplied together — `kind` selects the identity codec that resolves the narrowing' ``

The message returned when exactly one of `entityId` / `kind` is supplied.

## Remarks

They travel together because `kind` is what selects the identity codec, and the
codec is what makes the resolution unambiguous. One without the other is not a
partial narrowing that could be honored best-effort — it is not a narrowing at all.
