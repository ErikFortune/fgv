[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryIngestOrchestratorCreateParams

# Interface: IMemoryIngestOrchestratorCreateParams

Parameters for [MemoryIngestOrchestrator.create](../classes/MemoryIngestOrchestrator.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-classifier"></a> `classifier` | `readonly` | [`IMemoryClassifier`](IMemoryClassifier.md) | Stage 2 — the host's classifier. |
| <a id="property-codecs"></a> `codecs?` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), [`IIdentityCodec`](IIdentityCodec.md)\> | Per-kind identity codecs (maps a candidate `entityId` to its storage address). |
| <a id="property-cycleguard"></a> `cycleGuard?` | `readonly` | [`CycleGuardMode`](../type-aliases/CycleGuardMode.md) | Write-time cycle guard mode. Defaults to `'reject'`. |
| <a id="property-defaultcodec"></a> `defaultCodec?` | `readonly` | [`IIdentityCodec`](IIdentityCodec.md) | Default identity codec for kinds without an explicit entry. |
| <a id="property-embed"></a> `embed?` | `readonly` | [`MemoryEmbedder`](../type-aliases/MemoryEmbedder.md) | Optional embedder used to embed a candidate for layer-2 similarity search. |
| <a id="property-entityresolver"></a> `entityResolver?` | `readonly` | [`IEntityResolver`](IEntityResolver.md) | Stage 4 (optional, OQ-13) — the host's entity resolver. Absent → stage-4 dedup is exact-`{ kind, body }`-hash only (the deterministic-identity path). |
| <a id="property-extractor"></a> `extractor` | `readonly` | [`IFactExtractor`](IFactExtractor.md) | Stage 3 — the host's fact extractor. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Diagnostic logger (defaults to a no-op). |
| <a id="property-registry"></a> `registry` | `readonly` | [`IBodyConverterRegistry`](IBodyConverterRegistry.md) | Per-kind body converter registry — the stage-3 typed validation boundary. |
| <a id="property-relationextractor"></a> `relationExtractor` | `readonly` | [`IRelationExtractor`](IRelationExtractor.md) | Stage 5 — the host's relation extractor. |
| <a id="property-similaritythreshold"></a> `similarityThreshold?` | `readonly` | `number` | Stage-4 layer-2 cosine threshold. Defaults to [DEFAULT\_SIMILARITY\_THRESHOLD](../variables/DEFAULT_SIMILARITY_THRESHOLD.md) (`0.85`). |
| <a id="property-similaritytopk"></a> `similarityTopK?` | `readonly` | `number` | Stage-4 layer-2 top-K. Defaults to [DEFAULT\_SIMILARITY\_TOP\_K](../variables/DEFAULT_SIMILARITY_TOP_K.md) (`5`). |
| <a id="property-store"></a> `store` | `readonly` | [`IMemoryStore`](IMemoryStore.md) | The store every write bottoms out in (stage 6). |
| <a id="property-vectorindex"></a> `vectorIndex?` | `readonly` | [`IVectorIndex`](IVectorIndex.md) | Optional vector index for stage-4 layer-2 similarity candidate-gen. Wired together with [embed](#property-embed) AND [entityResolver](#property-entityresolver); absent (or either co-requisite absent) → layer-2 is skipped and dedup is exact-only. |
