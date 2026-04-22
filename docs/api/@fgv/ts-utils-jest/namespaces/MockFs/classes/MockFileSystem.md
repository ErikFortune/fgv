[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils-jest](../../../README.md) / [MockFs](../README.md) / MockFileSystem

# Class: MockFileSystem

## Constructors

### Constructor

> **new MockFileSystem**(`configs`, `options?`): `MockFileSystem`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `configs` | `Iterable`\<[`IMockFileConfig`](../interfaces/IMockFileConfig.md)\> |
| `options?` | [`IMockFileSystemOptions`](../interfaces/IMockFileSystemOptions.md) |

#### Returns

`MockFileSystem`

## Properties

| Property | Modifier | Type | Default value |
| ------ | ------ | ------ | ------ |
| <a id="_config"></a> `_config` | `readonly` | `Map`\<`string`, [`IMockFileConfig`](../interfaces/IMockFileConfig.md)\> | `undefined` |
| <a id="_data"></a> `_data` | `readonly` | `Map`\<`string`, `string`\> | `undefined` |
| <a id="_extrawrites"></a> `_extraWrites` | `readonly` | `string`[] | `[]` |
| <a id="_options"></a> `_options?` | `readonly` | [`IMockFileSystemOptions`](../interfaces/IMockFileSystemOptions.md) | `undefined` |
| <a id="_realreadfilesync"></a> `_realReadFileSync` | `readonly` | `ReadFunc` | `undefined` |

## Methods

### getExtraFilesWritten()

> **getExtraFilesWritten**(): `string`[]

#### Returns

`string`[]

***

### readMockFileSync()

> **readMockFileSync**(`wanted`): `string`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wanted` | `string` |

#### Returns

`string`

***

### reset()

> **reset**(): `void`

#### Returns

`void`

***

### startSpies()

> **startSpies**(`fsModule?`): [`ReadWriteSpies`](ReadWriteSpies.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fsModule?` | `__module` |

#### Returns

[`ReadWriteSpies`](ReadWriteSpies.md)

***

### tryGetPayload()

> **tryGetPayload**(`want`): `string` \| `undefined`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `want` | `string` |

#### Returns

`string` \| `undefined`

***

### writeMockFileSync()

> **writeMockFileSync**(`wanted`, `body`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wanted` | `string` |
| `body` | `string` |

#### Returns

`void`
