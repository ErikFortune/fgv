[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / ReferenceMapKeyPolicy

# Class: ReferenceMapKeyPolicy\<T\>

Policy object responsible for validating or correcting
keys in a [reference map](../interfaces/IJsonReferenceMap.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Constructors

### Constructor

> **new ReferenceMapKeyPolicy**\<`T`\>(`options?`, `isValid?`): `ReferenceMapKeyPolicy`\<`T`\>

Constructs a new ReferenceMapKeyPolicy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IReferenceMapKeyPolicyValidateOptions`](../interfaces/IReferenceMapKeyPolicyValidateOptions.md) | Optional [options](../interfaces/IReferenceMapKeyPolicyValidateOptions.md) used to construct the ReferenceMapKeyPolicy. |
| `isValid?` | (`key`, `item?`) => `boolean` | An optional predicate to test a supplied key for validity. |

#### Returns

`ReferenceMapKeyPolicy`\<`T`\>

## Methods

### isValid()

> **isValid**(`key`, `item?`): `boolean`

Determines if a supplied key and item are valid according to the current policy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to be tested. |
| `item?` | `T` | The item to be tested. |

#### Returns

`boolean`

`true` if the key and value are valid, `false` otherwise.

***

### validate()

> **validate**(`key`, `item?`, `__options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Determines if a supplied key and item are valid according to the current policy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to be tested. |
| `item?` | `T` | The item to be tested. |
| `__options?` | [`IReferenceMapKeyPolicyValidateOptions`](../interfaces/IReferenceMapKeyPolicyValidateOptions.md) | - |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

`Success` with the key if valid, `Failure` with an error message if invalid.

***

### validateItems()

> **validateItems**(`items`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\[`string`, `T`\][]\>

Validates an array of entries using the validation rules for this policy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `items` | \[`string`, `T`\][] | The array of entries to be validated. |
| `options?` | [`IReferenceMapKeyPolicyValidateOptions`](../interfaces/IReferenceMapKeyPolicyValidateOptions.md) | Optional [options](../interfaces/IReferenceMapKeyPolicyValidateOptions.md) to control validation. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\[`string`, `T`\][]\>

`Success` with an array of validated entries, or `Failure` with an error message
if validation fails.

***

### validateMap()

> **validateMap**(`map`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Map`\<`string`, `T`\>\>

Validates a `Map\<string, T\>` using the validation rules for this policy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `map` | `Map`\<`string`, `T`\> | - |
| `options?` | [`IReferenceMapKeyPolicyValidateOptions`](../interfaces/IReferenceMapKeyPolicyValidateOptions.md) | Optional [options](../interfaces/IReferenceMapKeyPolicyValidateOptions.md) to control validation. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Map`\<`string`, `T`\>\>

`Success` with a new `Map\<string, T\>`, or `Failure` with an error message
if validation fails.

***

### defaultKeyPredicate()

> `static` **defaultKeyPredicate**(`key`): `boolean`

The static default key name validation predicate rejects keys that contain
mustache templates or which start with the default conditional prefix
`'?'`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to test. |

#### Returns

`boolean`

`true` if the key is valid, `false` otherwise.
