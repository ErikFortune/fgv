[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IListCompletionReport

# Interface: IListCompletionReport

What one pump pass did.

## Remarks

`completed` names only lists this principal completed. A candidate it may not complete, or
that no longer qualifies when rechecked under the writer, is left as it is and not reported.
`next` is present when the pass stopped at its limit. It is an opaque continuation, bound to the
view and the policy epoch it was issued under: the candidate it resumes after may be one this
principal cannot see, so it is never named.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-completed"></a> `completed` | `readonly` | readonly [`ITaskMutationResult`](ITaskMutationResult.md)[] |
| <a id="property-next"></a> `next?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
