[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / SystemConfiguration

# Class: SystemConfiguration

A system configuration for both runtime or build.

## Constructors

### Constructor

> `protected` **new SystemConfiguration**(`config`, `initParams?`): `SystemConfiguration`

Constructs a new instance of a SystemConfiguration from the
supplied [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md) | The [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md) to use. |
| `initParams?` | [`ISystemConfigurationInitParams`](../interfaces/ISystemConfigurationInitParams.md) | - |

#### Returns

`SystemConfiguration`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifier types](../../QualifierTypes/classes/QualifierTypeCollector.md) that this system configuration uses. |
| <a id="qualifiertypes"></a> `qualifierTypes` | `readonly` | [`ReadOnlyQualifierTypeCollector`](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) | The [qualifier types](../../QualifierTypes/classes/QualifierTypeCollector.md) that this system configuration uses. |
| <a id="resourcetypes"></a> `resourceTypes` | `readonly` | [`ReadOnlyResourceTypeCollector`](../../ResourceTypes/type-aliases/ReadOnlyResourceTypeCollector.md) | The [resource types](../../ResourceTypes/classes/ResourceTypeCollector.md) that this system configuration uses. |

## Accessors

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

The description of this system configuration.

##### Returns

`string` \| `undefined`

***

### name

#### Get Signature

> **get** **name**(): `string` \| `undefined`

The name of this system configuration.

##### Returns

`string` \| `undefined`

## Methods

### getConfig()

> **getConfig**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md)\>

Returns the [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md) that this
SystemConfiguration was created from.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md)\>

`Success` with the [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md)
if successful, `Failure` with an error message otherwise.

***

### create()

> `static` **create**(`config`, `initParams?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SystemConfiguration`\>

Creates a new SystemConfiguration from the supplied
[system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md) | The [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md) to use. |
| `initParams?` | [`ISystemConfigurationInitParams`](../interfaces/ISystemConfigurationInitParams.md) | Optional [initialization parameters](../interfaces/ISystemConfigurationInitParams.md). |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SystemConfiguration`\>

`Success` with the new SystemConfiguration
if successful, `Failure` with an error message otherwise.

***

### loadFromFile()

> `static` **loadFromFile**(`path`, `initParams?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SystemConfiguration`\>

Loads a SystemConfiguration from a file.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path to the file to load. |
| `initParams?` | [`ISystemConfigurationInitParams`](../interfaces/ISystemConfigurationInitParams.md) | - |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SystemConfiguration`\>

`Success` with the SystemConfiguration
if successful, `Failure` with an error message otherwise.
