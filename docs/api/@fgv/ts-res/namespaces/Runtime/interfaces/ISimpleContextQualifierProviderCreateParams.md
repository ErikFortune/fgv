[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ISimpleContextQualifierProviderCreateParams

# Interface: ISimpleContextQualifierProviderCreateParams

Parameters for creating a [SimpleContextQualifierProvider](../classes/SimpleContextQualifierProvider.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-qualifiers"></a> `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [readonly qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) that defines and validates qualifiers. |
| <a id="property-qualifiervalues"></a> `qualifierValues?` | `Readonly`\<`Partial`\<`Record`\<`string`, [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>\>\> | Optional record of initial qualifier name-value pairs to populate the provider. **Remarks** Typed as `Readonly<Partial<Record<string, QualifierContextValue>>>` so a caller can naturally express conditional context construction, e.g. `tone === 'formal' ? { tone: 'formal' } : {}`. Entries whose value is `undefined` are skipped on load - semantically equivalent to omitting the key, which is how the candidate selector treats a missing key. |
