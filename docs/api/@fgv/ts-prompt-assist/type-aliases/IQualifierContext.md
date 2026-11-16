[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IQualifierContext

# Type Alias: IQualifierContext

> **IQualifierContext** = `Readonly`\<`Partial`\<`Record`\<`string`, `string`\>\>\>

Caller-supplied qualifier context at resolve time.
Maps qualifier axis name to value.

## Remarks

The context is intentionally a flat `Partial<Record<string, string>>`
even though `IPromptCandidateRecord.conditions` accepts the richer
ts-res `ConditionSetDecl` (record-with-details with `priority` /
`scoreAsDefault`, plus array form). The asymmetry is by design: ts-
res's `SimpleContextQualifierProvider` itself takes a flat
`Partial<Record<string, string>>`, so caller context is intentionally
simple; descriptor-side condition complexity flows through ts-res's
resolver unchanged. See design §10 + §15.5 (Option C) for the
rationale.

`Partial<...>` widening (post-F14): TS-friendly with the common
`tone === 'formal' ? \{ tone: 'formal' \} : \{\}` shape — the empty-object
branch assigns cleanly without requiring an explicit annotation. The
underlying ts-res candidate selector treats missing keys and
explicit-undefined identically (per PR B's note).
