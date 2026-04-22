[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / Condition

# Class: Condition

Represents a single condition applied to some resource instance.

## Implements

- [`IValidatedConditionDecl`](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md)

## Constructors

### Constructor

> `protected` **new Condition**(`params`): `Condition`

Constructs a new Condition object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatedConditionDecl`](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md) | The [validated condition declaration](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md) used to construct this condition. |

#### Returns

`Condition`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_collectible"></a> `_collectible` | `protected` | [`Collectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ConditionKey`](../type-aliases/ConditionKey.md), [`ConditionIndex`](../type-aliases/ConditionIndex.md)\> | - |
| <a id="operator"></a> `operator` | `readonly` | [`ConditionOperator`](../type-aliases/ConditionOperator.md) | The [operator](../type-aliases/ConditionOperator.md) used when matching context value to condition value. |
| <a id="priority"></a> `priority` | `readonly` | [`ConditionPriority`](../type-aliases/ConditionPriority.md) | The [relative priority](../type-aliases/ConditionPriority.md) of this condition. |
| <a id="qualifier"></a> `qualifier` | `readonly` | [`Qualifier`](Qualifier.md) | The [qualifier](Qualifier.md) used in this condition. |
| <a id="scoreasdefault"></a> `scoreAsDefault?` | `readonly` | [`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md) | The [score](../type-aliases/QualifierMatchScore.md) to be used when this condition is the default. |
| <a id="value"></a> `value` | `readonly` | [`QualifierConditionValue`](../type-aliases/QualifierConditionValue.md) | The value to be matched in this condition. |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`ConditionIndex`](../type-aliases/ConditionIndex.md) \| `undefined`

##### Returns

[`ConditionIndex`](../type-aliases/ConditionIndex.md) \| `undefined`

#### Implementation of

[`IValidatedConditionDecl`](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md).[`index`](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`ConditionKey`](../type-aliases/ConditionKey.md)

##### Returns

[`ConditionKey`](../type-aliases/ConditionKey.md)

## Methods

### canMatchPartialContext()

> **canMatchPartialContext**(`context`, `options?`): `boolean`

Determines if this condition can match the supplied context, even if the context is partial.

Returns true if:
- The qualifier specified in the condition is not present in the context
- The qualifier is present and matches the condition

Returns false if:
- The qualifier is present in the context and does not match the condition

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The context to match against. |
| `options?` | [`IContextMatchOptions`](../namespaces/Context/interfaces/IContextMatchOptions.md) | Options to use when matching the context. |

#### Returns

`boolean`

`true` if the condition can match the (possibly partial) context, `false` otherwise.

***

### getContextMatch()

> **getContextMatch**(`context`, `options?`): [`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md) \| `undefined`

Determines if this condition matches the supplied [validated context](../namespaces/Context/type-aliases/IValidatedContextDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The [context](../namespaces/Context/type-aliases/IValidatedContextDecl.md) to match against. |
| `options?` | [`IContextMatchOptions`](../namespaces/Context/interfaces/IContextMatchOptions.md) | The [options](../namespaces/Context/interfaces/IContextMatchOptions.md) to use when matching the context. |

#### Returns

[`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md) \| `undefined`

A [match score](../type-aliases/QualifierMatchScore.md) indicating match quality if the condition is present
in the context to be matched, `undefined` otherwise.

#### Remarks

If [\`options.partialContextMatch\`](../namespaces/Context/interfaces/IContextMatchOptions.md#partialcontextmatch) is `true`, then
the method will return `undefined` if the corresponding qualifier is not present in the context.

***

### setIndex()

> **setIndex**(`index`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionIndex`](../type-aliases/ConditionIndex.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | [`ConditionIndex`](../type-aliases/ConditionIndex.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionIndex`](../type-aliases/ConditionIndex.md)\>

***

### toChildConditionDecl()

> **toChildConditionDecl**(`options?`): [`IChildConditionDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildConditionDecl.md)

Gets the [child condition declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildConditionDecl.md) for this condition.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IDeclarationOptions`](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) | The [options](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) to use when creating the child condition declaration. |

#### Returns

[`IChildConditionDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildConditionDecl.md)

The [child condition declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildConditionDecl.md) for this condition.

***

### toCompiled()

> **toCompiled**(`options?`): [`ICompiledCondition`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledCondition.md)

Converts this condition to a compiled condition representation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ICompiledResourceOptions`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceOptions.md) | Optional compilation options controlling the output format. |

#### Returns

[`ICompiledCondition`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledCondition.md)

A compiled condition object that can be used for serialization or runtime processing.

***

### toKey()

> **toKey**(): [`ConditionKey`](../type-aliases/ConditionKey.md)

Gets the [key](../type-aliases/ConditionKey.md) for this condition.

#### Returns

[`ConditionKey`](../type-aliases/ConditionKey.md)

-

***

### toLooseConditionDecl()

> **toLooseConditionDecl**(`options?`): [`ILooseConditionDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md)

Gets the [loose condition declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md) for this condition.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IDeclarationOptions`](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) | The [options](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) to use when creating the loose condition declaration. |

#### Returns

[`ILooseConditionDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md)

The [loose condition declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md) for this condition.

***

### toString()

> **toString**(): `string`

Get a human-readable string representation of the condition.

#### Returns

`string`

A string representation of the condition.

***

### toToken()

> **toToken**(`terse?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionToken`](../type-aliases/ConditionToken.md)\>

Gets a [condition token](../type-aliases/ConditionToken.md) for this condition, if possible.
It is not possible to get a token for a condition with an operator other than `matches`,
with other-than-default priority, or with a name or value that contains other than alphanumeric
characters, underscore or non-leading hyphen.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `terse?` | `boolean` | if `true` and if the qualifier token is optional, the token will be omitted from the generated [condition token](../type-aliases/ConditionToken.md). |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionToken`](../type-aliases/ConditionToken.md)\>

***

### toValueOrChildConditionDecl()

> **toValueOrChildConditionDecl**(`options?`): `string` \| [`IChildConditionDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildConditionDecl.md)

Gets the value for this condition, or the [child condition declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildConditionDecl.md)
if the condition has non-default operator, priority or a score as default.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IDeclarationOptions`](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) | The [options](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) to use when creating the child condition declaration. |

#### Returns

`string` \| [`IChildConditionDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildConditionDecl.md)

A string value for this condition, or the [child condition declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildConditionDecl.md)
if the condition has non-default operator, priority or a score as default.

***

### compare()

> `static` **compare**(`c1`, `c2`): `number`

Compares two conditions for sorting purposes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c1` | `Condition` | The first condition to compare. |
| `c2` | `Condition` | The second condition to compare. |

#### Returns

`number`

A negative number if c1 should come before c2, a positive number
if c2 should come before c1, or zero if they are equivalent.

***

### create()

> `static` **create**(`decl`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Condition`\>

Creates a new Condition object from the supplied
[validated condition declaration](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`IValidatedConditionDecl`](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md) | The [validated condition declaration](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md) describing the condition to create. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Condition`\>

`Success` with the new Condition if successful,
`Failure` otherwise.

***

### getKeyForDecl()

> `static` **getKeyForDecl**(`decl`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionKey`](../type-aliases/ConditionKey.md)\>

Gets the [condition key](../type-aliases/ConditionKey.md) for a supplied [condition declaration](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`IValidatedConditionDecl`](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md) | The [condition declaration](../namespaces/Conditions/interfaces/IValidatedConditionDecl.md) for which to get the key. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionKey`](../type-aliases/ConditionKey.md)\>

`Success` with the condition key if successful, `Failure` otherwise.
