[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / GridValidationState

# Class: GridValidationState

Grid validation state management utility.

## Constructors

### Constructor

> **new GridValidationState**(): `GridValidationState`

#### Returns

`GridValidationState`

## Accessors

### errorCount

#### Get Signature

> **get** **errorCount**(): `number`

Get total count of validation errors.

##### Returns

`number`

***

### hasErrors

#### Get Signature

> **get** **hasErrors**(): `boolean`

Check if any cells have validation errors.

##### Returns

`boolean`

## Methods

### clearAll()

> **clearAll**(): `void`

Clear all validation errors.

#### Returns

`void`

***

### clearCell()

> **clearCell**(`resourceId`, `columnId`): `void`

Clear validation error for a specific cell.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `resourceId` | `string` |
| `columnId` | `string` |

#### Returns

`void`

***

### clearResource()

> **clearResource**(`resourceId`): `void`

Clear validation errors for a specific resource.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `resourceId` | `string` |

#### Returns

`void`

***

### getAllErrors()

> **getAllErrors**(): `object`[]

Get all error messages as a flat array.

#### Returns

`object`[]

***

### getCellError()

> **getCellError**(`resourceId`, `columnId`): `string` \| `null`

Get validation error for a specific cell.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `resourceId` | `string` |
| `columnId` | `string` |

#### Returns

`string` \| `null`

***

### getResourceErrors()

> **getResourceErrors**(`resourceId`): `Map`\<`string`, `string`\>

Get all validation errors for a resource.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `resourceId` | `string` |

#### Returns

`Map`\<`string`, `string`\>

***

### hasCellError()

> **hasCellError**(`resourceId`, `columnId`): `boolean`

Check if a specific cell has validation errors.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `resourceId` | `string` |
| `columnId` | `string` |

#### Returns

`boolean`

***

### setCellError()

> **setCellError**(`resourceId`, `columnId`, `error`): `void`

Set validation error for a specific cell.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resourceId` | `string` | Resource ID for the row |
| `columnId` | `string` | Column ID for the cell |
| `error` | `string` \| `null` | Error message, or null to clear error |

#### Returns

`void`
