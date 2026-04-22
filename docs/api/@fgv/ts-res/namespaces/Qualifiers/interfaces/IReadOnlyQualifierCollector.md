[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Qualifiers](../README.md) / IReadOnlyQualifierCollector

# Interface: IReadOnlyQualifierCollector

Readonly version of [QualifierCollector](../classes/QualifierCollector.md).

## Extends

- [`IReadOnlyValidatingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md)\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="qualifiertypes"></a> `qualifierTypes` | `readonly` | [`ReadOnlyQualifierTypeCollector`](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) | The [qualifier types](../../QualifierTypes/classes/QualifierTypeCollector.md) that this collector uses. |
| <a id="size"></a> `size` | `readonly` | `number` | Returns the number of entries in the map. |
| <a id="validating"></a> `validating` | `readonly` | [`IReadOnlyCollectorValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md)\> | A [CollectorValidator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which validates keys and values before inserting them into this collector. |

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\>\>

An iterator over the map entries.

#### Inherited from

`Collections.IReadOnlyValidatingCollector.[iterator]`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\>\>

An iterator over the map entries.

#### Inherited from

`Collections.IReadOnlyValidatingCollector.entries`

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Inherited from

`Collections.IReadOnlyValidatingCollector.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key to retrieve. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Inherited from

`Collections.IReadOnlyValidatingCollector.get`

***

### getAt()

> **getAt**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Gets the item at a specified index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index of the item to retrieve. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

`Success` with the item if it exists, or `Failure` with an error if the index is out of range.

#### Inherited from

`Collections.IReadOnlyValidatingCollector.getAt`

***

### getByNameOrToken()

> **getByNameOrToken**(`nameOrToken`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Gets a [qualifier](../../../classes/Qualifier.md) by name or token.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrToken` | `string` | The name or token of the qualifier to retrieve. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

`Success` with the qualifier if found, or `Failure` if not.

***

### has()

> **has**(`key`): `boolean`

Returns `true` if the map contains a key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key to check. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

`Collections.IReadOnlyValidatingCollector.has`

***

### hasNameOrToken()

> **hasNameOrToken**(`nameOrToken`): `boolean`

Checks if a qualifier with a given name or token is in the collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrToken` | `string` | The name or token of the qualifier to check. |

#### Returns

`boolean`

`true` if the qualifier is in the collection, `false` if not.

***

### keys()

> **keys**(): `IterableIterator`\<[`QualifierName`](../../../type-aliases/QualifierName.md)\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`QualifierName`](../../../type-aliases/QualifierName.md)\>

An iterator over the map keys.

#### Inherited from

`Collections.IReadOnlyValidatingCollector.keys`

***

### values()

> **values**(): `IterableIterator`\<[`Qualifier`](../../../classes/Qualifier.md)\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<[`Qualifier`](../../../classes/Qualifier.md)\>

An iterator over the map values.

#### Inherited from

`Collections.IReadOnlyValidatingCollector.values`

***

### valuesByIndex()

> **valuesByIndex**(): readonly [`Qualifier`](../../../classes/Qualifier.md)[]

Gets all items in the collection, ordered by index.

#### Returns

readonly [`Qualifier`](../../../classes/Qualifier.md)[]

An array of items in the collection, ordered by index.

#### Inherited from

`Collections.IReadOnlyValidatingCollector.valuesByIndex`
