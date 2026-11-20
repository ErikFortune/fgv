[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AiToolConflictPolicy

# Type Alias: AiToolConflictPolicy

> **AiToolConflictPolicy** = `"drop-server-tools"` \| `"prefer-server-tools"` \| `"fail"`

What to do when a request would combine a server tool with client (function)
tools on a provider that declares the two mutually exclusive (see
`IAiProviderDescriptor.serverToolsExclusiveWithClientTools`).

## Remarks

- `'drop-server-tools'` (the default) removes the offending server tools and
  keeps every client tool. Client tools are what the host registered
  explicitly for this turn; a built-in like grounding is a per-provider
  nicety, and dropping it degrades the turn rather than losing it.
- `'prefer-server-tools'` is the mirror image: keep the server tools and drop
  every client tool. For hosts whose turn is *about* the grounded answer.
- `'fail'` refuses the request up front with a message naming the conflict —
  the behavior before this policy existed. For hosts that would rather
  choose themselves than have either half silently disappear.

Whichever is chosen, what actually happened is reported, never inferred: see
[AiAssist.IAiToolConflictReport](../interfaces/IAiToolConflictReport.md).
