[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IClientToolRound

# Interface: IClientToolRound

One completed round of a `runClientToolLoop` loop.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-calls"></a> `calls` | `readonly` | readonly [`IAiClientToolCallSummary`](IAiClientToolCallSummary.md)[] | The tool calls made this round, each with its `durationMs` (empty on a completing round). |
| <a id="property-fulltext"></a> `fullText` | `readonly` | `string` | The round's full model text (may be empty). |
| <a id="property-providerdurationms"></a> `providerDurationMs` | `readonly` | `number` | The round's elapsed time on the loop's clock minus the sum of its calls' `durationMs`, floored at zero. Everything that is not tool time counts — the provider, and also the time spent in synchronous `observer.event` hooks during the drain. |
| <a id="property-round"></a> `round` | `readonly` | `number` | 1-based round number. |
| <a id="property-toolconflicts"></a> `toolConflicts` | `readonly` | [`IAiToolConflictReport`](IAiToolConflictReport.md) | What tool-conflict resolution did to this round's tools. |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` | The provider's own truncation report for this round. Reported, never acted on: what to do with a truncated round is the caller's decision. |
| <a id="property-usage"></a> `usage?` | `readonly` | [`IAiCompletionUsage`](IAiCompletionUsage.md) | The round's token usage, when the provider reported it. Never a fabricated zero. |
