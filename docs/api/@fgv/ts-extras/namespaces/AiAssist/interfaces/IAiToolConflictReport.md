[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiToolConflictReport

# Interface: IAiToolConflictReport

What the conflict resolution did to a turn's tools.

## Remarks

Required on [AiAssist.IAiClientToolTurnResult](IAiClientToolTurnResult.md), not optional, for the same reason
`structuredOutput` is required on a completion response: an absent report is
three-ways ambiguous — nothing conflicted / this build predates the feature /
the resolution ran and said nothing — and disambiguating exactly that is what
it is for. A turn where nothing conflicted reports the policy that was in
force and two empty arrays.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-droppedclienttools"></a> `droppedClientTools` | `readonly` | readonly `string`[] | Names of client tools removed from the request. Empty when nothing was dropped. |
| <a id="property-droppedservertools"></a> `droppedServerTools` | `readonly` | readonly `"web_search"`[] | Server tool types removed from the request. Empty when nothing was dropped. |
| <a id="property-policy"></a> `policy` | `readonly` | [`AiToolConflictPolicy`](../type-aliases/AiToolConflictPolicy.md) | The policy that was in force for this turn (the default when none was passed). |
