[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IEntityResolver

# Interface: IEntityResolver

Stage 4 (optional) — the host's entity resolver (OQ-13, LOCKED OPTIONAL). When
supplied, fgv surfaces near-duplicate [IEntityResolutionCandidate](IEntityResolutionCandidate.md)s (from
layer-2 similarity search) and the resolver returns a
[ResolutionVerdict](../type-aliases/ResolutionVerdict.md). When ABSENT, stage-4 dedup falls back to
exact-`{ kind, body }`-hash only — the deterministic-identity host path.

## Methods

### resolve()

> **resolve**(`candidate`, `similar`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ResolutionVerdict`](../type-aliases/ResolutionVerdict.md)\>\>

Decide whether `candidate` is new, a duplicate of / supersedes / merges into
one of the surfaced `similar` records. `similar` is non-empty and ordered by
descending score when the resolver is invoked (fgv only calls it when
layer-2 surfaces at least one over-threshold neighbor).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `candidate` | [`ICandidateRecord`](ICandidateRecord.md) |
| `similar` | readonly [`IEntityResolutionCandidate`](IEntityResolutionCandidate.md)[] |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ResolutionVerdict`](../type-aliases/ResolutionVerdict.md)\>\>
