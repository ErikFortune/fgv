[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / LiteralValueHierarchy

# Class: LiteralValueHierarchy\<T\>

A class that implements a hierarchy of literal values. The hierarchy is defined as a
tree, where each value can have multiple children but only one parent. The root of the
tree has no parent. The hierarchy is used to determine the relationship between values
when matching conditions and contexts.

## Remarks

The hierarchy can be created in two modes:
- **Constrained mode**: When enumerated values are provided, only those values are allowed
  in the hierarchy and matching operations.
- **Open values mode**: When no enumerated values are provided, all values referenced in
  the hierarchy are automatically collected and used. This allows for flexible hierarchies
  where any value can be used in matching operations.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `string` | `string` |

## Constructors

### Constructor

> `protected` **new LiteralValueHierarchy**\<`T`\>(`params`): `LiteralValueHierarchy`\<`T`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ILiteralValueHierarchyCreateParams`](../interfaces/ILiteralValueHierarchyCreateParams.md)\<`T`\> |

#### Returns

`LiteralValueHierarchy`\<`T`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="isopenvalues"></a> `isOpenValues` | `readonly` | `boolean` | Indicates whether this hierarchy was created with open values (no enumerated values provided), allowing any value to be used in matching operations. |
| <a id="values"></a> `values` | `readonly` | `ReadonlyMap`\<`T`, [`ILiteralValue`](../interfaces/ILiteralValue.md)\<`T`\>\> | A map of all allowed literal values to the corresponding [ILiteralValue](../interfaces/ILiteralValue.md) validated definition. |

## Methods

### asRecord()

> **asRecord**(): `Record`\<`string`, `string`\>

Converts the hierarchy to a record of parent-child relationships.

#### Returns

`Record`\<`string`, `string`\>

A record of parent-child relationships.

***

### getAncestors()

> **getAncestors**(`value`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`[]\>

Gets all ancestors of a value in the hierarchy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to get ancestors for. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`[]\>

`Success` with an array of ancestor values, ordered from immediate parent
to root, or `Failure` if the value is not in the hierarchy.

***

### getDescendants()

> **getDescendants**(`value`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`[]\>

Gets all descendants of a value in the hierarchy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to get descendants for. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`[]\>

`Success` with an array of descendant values, or `Failure` if the value
is not in the hierarchy.

***

### getRoots()

> **getRoots**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`[]\>

Gets all root values (values with no parent) in the hierarchy.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`[]\>

`Success` with an array of root values.

***

### hasValue()

> **hasValue**(`value`): `boolean`

Checks if a value exists in the hierarchy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to check. |

#### Returns

`boolean`

`true` if the value exists in the hierarchy, `false` otherwise.

***

### isAncestor()

> **isAncestor**(`value`, `possibleAncestor`): `boolean`

Determines if a value is an ancestor of a possible ancestor value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to check. |
| `possibleAncestor` | `T` | The possible ancestor value. |

#### Returns

`boolean`

`true` if the value is an ancestor of the possible ancestor, `false` otherwise.

***

### match()

#### Call Signature

> **match**(`condition`, `context`): [`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `condition` | `T` |
| `context` | `T` |

##### Returns

[`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

#### Call Signature

> **match**(`condition`, `context`, `__operator?`): [`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

Matches a condition value against a context value, where an exact match of the
condition and context returns [PerfectMatch](../../../variables/PerfectMatch.md), a condition
value that does not match the context value or any of its ancestors returns
[NoMatch](../../../variables/NoMatch.md), and a condition value that matches the context value
or any of its ancestors returns a positive score that is less than
[PerfectMatch](../../../variables/PerfectMatch.md), with the score decreasing with each ancestor
in the hierarchy.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | [`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md) | The condition value to match. |
| `context` | [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md) | The context value to match against. |
| `__operator?` | [`ConditionOperator`](../../../type-aliases/ConditionOperator.md) | The operator used for matching (not used in this implementation). |

##### Returns

[`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

A [QualifierMatchScore](../../../type-aliases/QualifierMatchScore.md) indicating the match score.

***

### \_buildValuesFromHierarchy()

> `protected` `static` **\_buildValuesFromHierarchy**\<`T`\>(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadonlyMap`\<`T`, [`ILiteralValue`](../interfaces/ILiteralValue.md)\<`T`\>\>\>

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ILiteralValueHierarchyCreateParams`](../interfaces/ILiteralValueHierarchyCreateParams.md)\<`T`\> |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadonlyMap`\<`T`, [`ILiteralValue`](../interfaces/ILiteralValue.md)\<`T`\>\>\>

***

### create()

> `static` **create**\<`T`\>(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LiteralValueHierarchy`\<`T`\>\>

Creates a new LiteralValueHierarchy instance.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ILiteralValueHierarchyCreateParams`](../interfaces/ILiteralValueHierarchyCreateParams.md)\<`T`\> | The [parameters](../interfaces/ILiteralValueHierarchyCreateParams.md) used to create the hierarchy. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LiteralValueHierarchy`\<`T`\>\>

`Success` with the new hierarchy or `Failure` with an error message.
