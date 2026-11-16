[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / maximumUpdateBytes

# Function: maximumUpdateBytes()

> **maximumUpdateBytes**(`profile`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

The most bytes one owed update can encode to under a profile: the smaller of
`maxUpdateBytes` and the update's derived schema maximum.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `profile` | [`ITaskCapacityProfile`](../interfaces/ITaskCapacityProfile.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

## Remarks

An update carries an audience, a category, an optional coalescing marker, its id, `required`, a
revision, a snapshot of one envelope, and its task id; storage admits a new update only when that
envelope is exactly the
committed envelope — itself bounded by `maxEnvelopeBytes` — and its audience holds at most
`maxAudiencePerUpdate` subscription ids. Everything else is fixed framing: identifiers bounded
by the field bound `maxIdLength` (which construction may lower and never raise, so its default
is a ceiling for every repository), revisions that are safe integers, and the closed category
set. So an update can never be larger than `maxEnvelopeBytes` plus that framing, whatever
`maxUpdateBytes` says: under the default profile, **37,417 bytes** against a `maxUpdateBytes`
of 64 KiB.

This is the unit every forward reservation of an update's payload uses — the terminal closeout,
a first resolution and an accepted operation's settlement. A reservation guarantees a step not
yet taken, so it must be the most that step could need; this is the most, and `maxUpdateBytes`
is not. It is computed rather than stored, so a profile never has to be rewritten to tighten it.

Fails rather than returning an inexact figure when the bounds push the sum past the safe-integer
range.
