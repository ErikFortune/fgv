[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-random](../../../README.md) / [Generator](../README.md) / pickWeightedAt

# Function: pickWeightedAt()

> **pickWeightedAt**\<`T`\>(`unit`, `candidates`): `T` \| `undefined`

Chooses one candidate with probability proportional to its weight, as a pure
function of a unit float. The same `unit` and `candidates` always choose the
same item, so a caller whose randomness comes from elsewhere (for example a
hash ratio) gets a stable choice.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `unit` | `number` | The unit float in `[0, 1]` that selects the candidate. |
| `candidates` | readonly [`IWeightedCandidate`](../interfaces/IWeightedCandidate.md)\<`T`\>[] | The weighted candidates, in the order to walk them. |

## Returns

`T` \| `undefined`

The chosen item, or `undefined` if `unit` is out of range or no
candidate is eligible.

## Remarks

- A candidate is eligible only if its weight is finite and greater than `0`.
  Zero, negative, `NaN` and `±Infinity` weights are never chosen.
- When no candidate is eligible (including an empty list), returns `undefined`.
- `unit` is accepted on the closed interval `[0, 1]`. A `unit` outside that
  interval, or `NaN`, returns `undefined`.
- The walk: `point = unit * total`, where `total` is the sum of the eligible
  weights. Eligible candidates are walked in input order, and the first whose
  cumulative upper bound satisfies `point < cumulative` is chosen. The last
  eligible candidate wins by elimination, so `unit = 1` and any floating-point
  shortfall land on it rather than falling off the end.
- If `total` is not finite (the eligible weights overflow when summed), every
  eligible weight is divided by the largest eligible weight and the total is
  recomputed. This happens only on overflow, so ordinary weights keep their
  exact float behavior. After rescaling, a weight below the float resolution of
  the largest contributes no range and is reachable only by elimination.

This walk is part of the contract: callers persist draws made through it, so it
must not change.
