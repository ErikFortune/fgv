[Home](../README.md) > Collections

# Namespace: Collections

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Utils](./Utils/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Collectible](./classes/Collectible.md)

</td><td>

Simple implementation of Collections.ICollectible | ICollectible which does not allow the index to be

</td></tr>
<tr><td>

[ConvertingCollector](./classes/ConvertingCollector.md)

</td><td>

A Collector | collector that collects Collections.ICollectible | ICollectible items,

</td></tr>
<tr><td>

[CacheInvalidatingResultMapWrapper](./classes/CacheInvalidatingResultMapWrapper.md)

</td><td>

A wrapper around a mutable result map that invalidates cache entries

</td></tr>
<tr><td>

[ConvertingResultMap](./classes/ConvertingResultMap.md)

</td><td>

A result map that wraps an inner Collections.IResultMap | IResultMap of source type
and returns lazily-converted, cached values of a target type.

</td></tr>
<tr><td>

[Collector](./classes/Collector.md)

</td><td>

A Collections.Collector | Collector that is a specialized collection
which contains items of type Collections.ICollectible | ICollectible,
which have a unique key and a write-once index.

</td></tr>
<tr><td>

[CollectorValidator](./classes/CollectorValidator.md)

</td><td>

A Collections.Collector | Collector wrapper which validates weakly-typed keys

</td></tr>
<tr><td>

[ConvertingCollectorValidator](./classes/ConvertingCollectorValidator.md)

</td><td>

A Collections.ConvertingCollector | ConvertingCollector wrapper which validates weakly-typed keys
and values before calling the wrapped collector.

</td></tr>
<tr><td>

[ValidatingConvertingCollector](./classes/ValidatingConvertingCollector.md)

</td><td>

A Collections.ConvertingCollector | ConvertingCollector with a

</td></tr>
<tr><td>

[KeyValueConverters](./classes/KeyValueConverters.md)

</td><td>

Helper class for converting strongly-typed keys, values, or entries

</td></tr>
<tr><td>

[ReadOnlyConvertingResultMap](./classes/ReadOnlyConvertingResultMap.md)

</td><td>

A read-only result map that wraps an inner Collections.IReadOnlyResultMap | IReadOnlyResultMap

</td></tr>
<tr><td>

[RetainingRingBuffer](./classes/RetainingRingBuffer.md)

</td><td>

A generic bounded most-recent-N ring of records, with monotonic-`seq` cursor

</td></tr>
<tr><td>

[ResultMap](./classes/ResultMap.md)

</td><td>

A Collections.ResultMap | ResultMap class as a `Map<TK, TV>`-like object which

</td></tr>
<tr><td>

[ReadOnlyResultMapValidator](./classes/ReadOnlyResultMapValidator.md)

</td><td>

A read-only validator for any Collections.IReadOnlyResultMap | IReadOnlyResultMap

</td></tr>
<tr><td>

[ResultMapValidator](./classes/ResultMapValidator.md)

</td><td>

A Collections.ResultMap | ResultMap wrapper which validates weakly-typed keys

</td></tr>
<tr><td>

[ValidatingCollector](./classes/ValidatingCollector.md)

</td><td>

A Collections.Collector | Collector with a Collections.CollectorValidator | CollectorValidator

</td></tr>
<tr><td>

[ValidatingReadOnlyConvertingResultMap](./classes/ValidatingReadOnlyConvertingResultMap.md)

</td><td>

A read-only result map that wraps an inner Collections.IReadOnlyResultMap | IReadOnlyResultMap

</td></tr>
<tr><td>

[ValidatingConvertingResultMap](./classes/ValidatingConvertingResultMap.md)

</td><td>

A result map that wraps an inner Collections.IResultMap | IResultMap of source type

</td></tr>
<tr><td>

[ValidatingResultMap](./classes/ValidatingResultMap.md)

</td><td>

A Collections.ResultMap | ResultMap with a Collections.ResultMapValidator | validator

</td></tr>
<tr><td>

[AggregatedResultMapValidator](./classes/AggregatedResultMapValidator.md)

</td><td>

A validator for weakly-typed access to an AggregatedResultMap | aggregated result map.

</td></tr>
<tr><td>

[AggregatedResultMapBase](./classes/AggregatedResultMapBase.md)

</td><td>

Base class for an aggregated result map that wraps a collection of ValidatingResultMap instances,
keyed by collection ID.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ICollectible](./interfaces/ICollectible.md)

</td><td>

An item that can be collected by some ConvertingCollector | Collector.

</td></tr>
<tr><td>

[ICollectibleConstructorParamsWithIndex](./interfaces/ICollectibleConstructorParamsWithIndex.md)

</td><td>

Parameters for constructing a new Collections.ICollectible | ICollectible instance with

</td></tr>
<tr><td>

[ICollectibleConstructorParamsWithConverter](./interfaces/ICollectibleConstructorParamsWithConverter.md)

</td><td>

Parameters for constructing a new Collections.ICollectible | ICollectible instance with an

</td></tr>
<tr><td>

[IConvertingCollectorConstructorParams](./interfaces/IConvertingCollectorConstructorParams.md)

</td><td>

Parameters for constructing a Collections.ConvertingCollector | ConvertingCollector.

</td></tr>
<tr><td>

[IConvertingResultMapConstructorParams](./interfaces/IConvertingResultMapConstructorParams.md)

</td><td>

Parameters for constructing a Collections.ConvertingResultMap | ConvertingResultMap.

</td></tr>
<tr><td>

[IReadOnlyCollector](./interfaces/IReadOnlyCollector.md)

</td><td>

A read-only interface exposing only the non-mutating methods of a Collections.Collector | ICollector.

</td></tr>
<tr><td>

[ICollectorConstructorParams](./interfaces/ICollectorConstructorParams.md)

</td><td>

Parameters for constructing a Collections.Collector | ICollector.

</td></tr>
<tr><td>

[IReadOnlyCollectorValidator](./interfaces/IReadOnlyCollectorValidator.md)

</td><td>

A read-only interface exposing non-mutating methods of a

</td></tr>
<tr><td>

[ICollectorValidatorCreateParams](./interfaces/ICollectorValidatorCreateParams.md)

</td><td>

Parameters for constructing a Collections.CollectorValidator | CollectorValidator.

</td></tr>
<tr><td>

[IConvertingCollectorValidatorCreateParams](./interfaces/IConvertingCollectorValidatorCreateParams.md)

</td><td>

Parameters for constructing a Collections.ConvertingCollectorValidator | ConvertingCollectorValidator.

</td></tr>
<tr><td>

[IValidatingConvertingCollectorConstructorParams](./interfaces/IValidatingConvertingCollectorConstructorParams.md)

</td><td>

Parameters for constructing a Collections.ValidatingConvertingCollector | ValidatingConvertingCollector.

</td></tr>
<tr><td>

[IKeyValueConverterConstructorParams](./interfaces/IKeyValueConverterConstructorParams.md)

</td><td>

Parameters for constructing a Collections.KeyValueConverters | KeyValueConverters instance.

</td></tr>
<tr><td>

[IReadOnlyResultMap](./interfaces/IReadOnlyResultMap.md)

</td><td>

A readonly `ReadonlyMap<TK, TV>`-like object which reports success or failure

</td></tr>
<tr><td>

[IReadOnlyConvertingResultMapConstructorParams](./interfaces/IReadOnlyConvertingResultMapConstructorParams.md)

</td><td>

Parameters for constructing a Collections.ReadOnlyConvertingResultMap | ReadOnlyConvertingResultMap.

</td></tr>
<tr><td>

[IRetainedRecord](./interfaces/IRetainedRecord.md)

</td><td>

Minimal structural contract a RetainingRingBuffer record must satisfy:
a monotonic `seq` the buffer pages on.

</td></tr>
<tr><td>

[IRetainingRingBufferQuery](./interfaces/IRetainingRingBufferQuery.md)

</td><td>

Query options for RetainingRingBuffer.query.

</td></tr>
<tr><td>

[IRetainingRingBufferCreateParams](./interfaces/IRetainingRingBufferCreateParams.md)

</td><td>

Construction options for RetainingRingBuffer.

</td></tr>
<tr><td>

[IResultMapConstructorParams](./interfaces/IResultMapConstructorParams.md)

</td><td>

Parameters for constructing a Collections.ResultMap | ResultMap.

</td></tr>
<tr><td>

[IResultMap](./interfaces/IResultMap.md)

</td><td>

Interface for a mutable Collections.ResultMap | ResultMap.

</td></tr>
<tr><td>

[IReadOnlyResultMapValidator](./interfaces/IReadOnlyResultMapValidator.md)

</td><td>

A read-only interface exposing non-mutating methods of a Collections.ResultMapValidator | ResultMapValidator.

</td></tr>
<tr><td>

[IResultMapValidatorCreateParams](./interfaces/IResultMapValidatorCreateParams.md)

</td><td>

Parameters for constructing a Collections.ResultMapValidator | ResultMapValidator.

</td></tr>
<tr><td>

[IReadOnlyValidatingCollector](./interfaces/IReadOnlyValidatingCollector.md)

</td><td>

A read-only interface exposing non-mutating methods of a

</td></tr>
<tr><td>

[IValidatingCollectorConstructorParams](./interfaces/IValidatingCollectorConstructorParams.md)

</td><td>

Parameters for constructing a Collections.ValidatingCollector | ValidatingCollector.

</td></tr>
<tr><td>

[IValidatingReadOnlyConvertingResultMapConstructorParams](./interfaces/IValidatingReadOnlyConvertingResultMapConstructorParams.md)

</td><td>

Parameters for constructing a

</td></tr>
<tr><td>

[IValidatingConvertingResultMapConstructorParams](./interfaces/IValidatingConvertingResultMapConstructorParams.md)

</td><td>

Parameters for constructing a

</td></tr>
<tr><td>

[IReadOnlyValidatingResultMap](./interfaces/IReadOnlyValidatingResultMap.md)

</td><td>

A read-only interface exposing non-mutating methods of a Collections.ValidatingResultMap | ValidatingResultMap.

</td></tr>
<tr><td>

[IValidatingResultMapConstructorParams](./interfaces/IValidatingResultMapConstructorParams.md)

</td><td>

Parameters for constructing a Collections.ResultMap | ResultMap.

</td></tr>
<tr><td>

[IReadonlyAggregatedResultMapEntry](./interfaces/IReadonlyAggregatedResultMapEntry.md)

</td><td>

A read-only collection entry in an AggregatedResultMap | aggregated result map.

</td></tr>
<tr><td>

[IMutableAggregatedResultMapEntry](./interfaces/IMutableAggregatedResultMapEntry.md)

</td><td>

A mutable collection entry in an AggregatedResultMap | aggregated result map.

</td></tr>
<tr><td>

[IAggregatedResultMapJsonEntryWithEntries](./interfaces/IAggregatedResultMapJsonEntryWithEntries.md)

</td><td>

JSON format for an AggregatedResultMap | aggregated result map collection entry using an entries array.

</td></tr>
<tr><td>

[IAggregatedResultMapJsonEntryWithItems](./interfaces/IAggregatedResultMapJsonEntryWithItems.md)

</td><td>

JSON format for an AggregatedResultMap | aggregated result map collection entry using a string-keyed items object.

</td></tr>
<tr><td>

[IAddCollectionWithItemsOptions](./interfaces/IAddCollectionWithItemsOptions.md)

</td><td>

Options for Collections.AggregatedResultMapBase.addCollectionWithItems | addCollectionWithItems.

</td></tr>
<tr><td>

[IAggregatedResultMapConstructorParams](./interfaces/IAggregatedResultMapConstructorParams.md)

</td><td>

Parameters for constructing an AggregatedResultMap | aggregated result map.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[CollectibleKey](./type-aliases/CollectibleKey.md)

</td><td>

Infer the key type from an Collections.ICollectible | ICollectible type.

</td></tr>
<tr><td>

[CollectibleIndex](./type-aliases/CollectibleIndex.md)

</td><td>

Infer the index type from an Collections.ICollectible | ICollectible type.

</td></tr>
<tr><td>

[CollectibleFactory](./type-aliases/CollectibleFactory.md)

</td><td>

Factory function for creating a new Collections.ICollectible | ICollectible instance given a key, an index and a source representation

</td></tr>
<tr><td>

[CollectibleFactoryCallback](./type-aliases/CollectibleFactoryCallback.md)

</td><td>

Factory function for creating a new Collections.ICollectible | ICollectible instance given a key and an index.

</td></tr>
<tr><td>

[ICollectibleConstructorParams](./type-aliases/ICollectibleConstructorParams.md)

</td><td>

Parameters for constructing a new Collections.ICollectible | ICollectible instance.

</td></tr>
<tr><td>

[CollectorResultDetail](./type-aliases/CollectorResultDetail.md)

</td><td>

Additional success or failure details for mutating collector calls.

</td></tr>
<tr><td>

[KeyValueEntry](./type-aliases/KeyValueEntry.md)

</td><td>

Generic key-value entry.

</td></tr>
<tr><td>

[ResultMapResultDetail](./type-aliases/ResultMapResultDetail.md)

</td><td>

Additional success or failure details for Collections.ResultMap | ResultMap calls.

</td></tr>
<tr><td>

[ResultMapForEachCb](./type-aliases/ResultMapForEachCb.md)

</td><td>

Callback for Collections.ResultMap | ResultMap `forEach` method.

</td></tr>
<tr><td>

[ConvertingResultMapValueConverter](./type-aliases/ConvertingResultMapValueConverter.md)

</td><td>

A function that converts a source value to a target value.

</td></tr>
<tr><td>

[ConversionErrorHandling](./type-aliases/ConversionErrorHandling.md)

</td><td>

Error handling behavior for conversion failures during iteration.

</td></tr>
<tr><td>

[ResultMapValueFactory](./type-aliases/ResultMapValueFactory.md)

</td><td>

Deferred constructor for the Collections.ResultMap.getOrAdd | getOrAdd method.

</td></tr>
<tr><td>

[AggregatedResultMapEntry](./type-aliases/AggregatedResultMapEntry.md)

</td><td>

A collection entry in an AggregatedResultMap | aggregated result map, either mutable or read-only.

</td></tr>
<tr><td>

[AggregatedResultMapJsonEntry](./type-aliases/AggregatedResultMapJsonEntry.md)

</td><td>

JSON format for an AggregatedResultMap | aggregated result map collection entry - supports both entries array and items object.

</td></tr>
<tr><td>

[AggregatedResultMapEntryInit](./type-aliases/AggregatedResultMapEntryInit.md)

</td><td>

Any valid input format for an AggregatedResultMap | aggregated result map collection entry.

</td></tr>
</tbody></table>
