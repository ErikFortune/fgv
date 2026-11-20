[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / defaultToolConflictPolicy

# Variable: defaultToolConflictPolicy

> `const` **defaultToolConflictPolicy**: [`AiToolConflictPolicy`](../type-aliases/AiToolConflictPolicy.md) = `'drop-server-tools'`

The default [AiAssist.AiToolConflictPolicy](../type-aliases/AiToolConflictPolicy.md) applied when a caller passes none.

## Remarks

Keeping the client tools is the right default because they are what the host
registered explicitly for *this* turn, while a built-in server tool is a
per-provider nicety the same host would get on some providers and not others.
Dropping the nicety degrades a turn; dropping the client tools changes what the
turn can do.
