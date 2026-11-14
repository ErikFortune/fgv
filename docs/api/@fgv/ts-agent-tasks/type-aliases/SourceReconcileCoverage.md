[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceReconcileCoverage

# Type Alias: SourceReconcileCoverage

> **SourceReconcileCoverage** = `"all-bindings"` \| `"active-only"`

Which bindings a reconciliation listing covers.

## Remarks

A source listing only active work cannot discover terminal outcomes it has stopped listing, so an
`active-only` page can never make a pass `complete` (design § 5: "a source listing only active
tasks cannot claim complete recovery").
