[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceRevisionOrder

# Type Alias: SourceRevisionOrder

> **SourceRevisionOrder** = `"older"` \| `"same"` \| `"newer"` \| `"incomparable"`

How two source revisions order, by the source's own comparator.

## Remarks

`incomparable` is an epoch change: nothing orders across it until an explicit recovery result
establishes the new baseline. Tokens are never ordered lexically or by observation time.
