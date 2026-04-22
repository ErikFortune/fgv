[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Unsd](../README.md) / RegionCodes

# Class: RegionCodes

## Constructors

### Constructor

> `protected` **new RegionCodes**(): `RegionCodes`

**`Internal`**

#### Returns

`RegionCodes`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="areas"></a> `areas` | `readonly` | [`Areas`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) |
| <a id="regions"></a> `regions` | `readonly` | [`Regions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) |

## Methods

### \_importRow()

> `protected` **\_importRow**(`row`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

**`Internal`**

Imports a single parsed row of UN M.49 region code data

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `row` | [`IM49CsvRow`](../namespaces/Csv/namespaces/Model/interfaces/IM49CsvRow.md) | The parsed row to be imported. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

`Success` with `true` if the row was successfully
imported, or `Failure` with details if an error occurs.

***

### \_importRows()

> `protected` **\_importRows**(`rows`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

**`Internal`**

Imports multiple parsed rows from UN M.49 region code data

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rows` | [`IM49CsvRow`](../namespaces/Csv/namespaces/Model/interfaces/IM49CsvRow.md)[] | The parsed rows to be imported. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

`Success` with `true` if the rows were successfully
imported, or `Failure` with details if an error occurs.

***

### getIsContained()

> **getIsContained**(`container`, `contained`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `container` | [`Region`](../type-aliases/Region.md) |
| `contained` | [`ICountryOrArea`](../interfaces/ICountryOrArea.md) \| [`Region`](../type-aliases/Region.md) |

#### Returns

`boolean`

***

### tryGetRegionOrArea()

> **tryGetRegionOrArea**(`code`): [`ICountryOrArea`](../interfaces/ICountryOrArea.md) \| [`Region`](../type-aliases/Region.md) \| `undefined`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | [`UnM49RegionCode`](../../Iana/namespaces/Model/type-aliases/UnM49RegionCode.md) |

#### Returns

[`ICountryOrArea`](../interfaces/ICountryOrArea.md) \| [`Region`](../type-aliases/Region.md) \| `undefined`

***

### create()

> `static` **create**(`rows`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RegionCodes`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rows` | [`IM49CsvRow`](../namespaces/Csv/namespaces/Model/interfaces/IM49CsvRow.md)[] |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RegionCodes`\>

***

### createFromJson()

> `static` **createFromJson**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RegionCodes`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RegionCodes`\>

***

### loadCsv()

> `static` **loadCsv**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RegionCodes`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RegionCodes`\>

***

### loadDefault()

> `static` **loadDefault**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RegionCodes`\>

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RegionCodes`\>
