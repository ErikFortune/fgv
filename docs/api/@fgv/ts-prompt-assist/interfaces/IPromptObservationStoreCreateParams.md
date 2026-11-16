[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptObservationStoreCreateParams

# Interface: IPromptObservationStoreCreateParams

Construction options for [PromptObservationStore.create](../classes/PromptObservationStore.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxrecords"></a> `maxRecords?` | `readonly` | `number` | Maximum number of observation records retained before the oldest is overwritten. Defaults to `1000`. Must be a positive integer if supplied. |
| <a id="property-qualifierresolver"></a> `qualifierResolver?` | `readonly` | [`IQualifierResolver`](IQualifierResolver.md) | Optional [IQualifierResolver](IQualifierResolver.md) that decides whether a record's `qualifierContext` matches a query's `qualifiers` criteria. Defaults to [defaultStringEqualityQualifierResolver](../variables/defaultStringEqualityQualifierResolver.md) (naive string equality on supplied axes). Injected here so deployments needing ts-res-equivalent similarity matching can swap the implementation without an API change on the store. |
