[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / LanguageTag

# Class: LanguageTag

Represents a single BCP-47 language tag.

## Constructors

### Constructor

> `protected` **new LanguageTag**(`subtags`, `validity`, `normalization`, `iana`): `LanguageTag`

**`Internal`**

Constructs a LanguageTag.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) from which the tag is constructed. |
| `validity` | [`TagValidity`](../type-aliases/TagValidity.md) | Known [validation level](../type-aliases/TagValidity.md) of the supplied subtags. |
| `normalization` | [`TagNormalization`](../type-aliases/TagNormalization.md) | Known [normalization level](../type-aliases/TagNormalization.md) of the supplied subtags. |
| `iana` | [`LanguageRegistries`](../../Iana/classes/LanguageRegistries.md) | The [Iana.LanguageRegistries](../../Iana/classes/LanguageRegistries.md) used to validate and normalize this tag. |

#### Returns

`LanguageTag`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_iana"></a> `_iana` | `readonly` | [`LanguageRegistries`](../../Iana/classes/LanguageRegistries.md) | **`Internal`** |
| <a id="_iscanonical"></a> `_isCanonical` | `protected` | `boolean` \| `undefined` | **`Internal`** |
| <a id="_ispreferred"></a> `_isPreferred` | `protected` | `boolean` \| `undefined` | **`Internal`** |
| <a id="_isstrictlyvalid"></a> `_isStrictlyValid` | `protected` | `boolean` \| `undefined` | **`Internal`** |
| <a id="_isvalid"></a> `_isValid` | `protected` | `boolean` \| `undefined` | **`Internal`** |
| <a id="_normalization"></a> `_normalization` | `protected` | [`TagNormalization`](../type-aliases/TagNormalization.md) | **`Internal`** |
| <a id="_suppressedscript"></a> `_suppressedScript` | `protected` | `false` \| [`ScriptSubtag`](../../Iana/namespaces/LanguageSubtags/type-aliases/ScriptSubtag.md) \| `undefined` | **`Internal`** |
| <a id="_validity"></a> `_validity` | `protected` | [`TagValidity`](../type-aliases/TagValidity.md) | **`Internal`** |
| <a id="registry"></a> `registry` | `readonly` | [`LanguageRegistryData`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | Details about this language tag from the IANA language registries. |
| <a id="subtags"></a> `subtags` | `readonly` | `Readonly`\<[`ISubtags`](../interfaces/ISubtags.md)\> | The individual [subtags](../namespaces/Subtags/README.md) for this language tag. |
| <a id="tag"></a> `tag` | `readonly` | `string` | A string representation of this language tag. |

## Accessors

### description

#### Get Signature

> **get** **description**(): `string`

Gets a text description of this tag.

##### Returns

`string`

***

### effectiveScript

#### Get Signature

> **get** **effectiveScript**(): [`ScriptSubtag`](../../Iana/namespaces/LanguageSubtags/type-aliases/ScriptSubtag.md) \| `undefined`

The effective script of this language tag, if known.
The effective script is the script subtag in the tag itself,
if present, or the `Suppress-Script` defined in the
[IANA subtag registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)
for the primary language of this tag.  Can be `undefined`
if neither the tag nor the IANA registry define a script.

##### Returns

[`ScriptSubtag`](../../Iana/namespaces/LanguageSubtags/type-aliases/ScriptSubtag.md) \| `undefined`

***

### isCanonical

#### Get Signature

> **get** **isCanonical**(): `boolean`

Whether this language tag is in canonical form.

##### Returns

`boolean`

***

### isGrandfathered

#### Get Signature

> **get** **isGrandfathered**(): `boolean`

Whether this language tag is a grandfathered tag.

##### Returns

`boolean`

***

### isPreferred

#### Get Signature

> **get** **isPreferred**(): `boolean`

Whether this language tag is in preferred form.

##### Returns

`boolean`

***

### isStrictlyValid

#### Get Signature

> **get** **isStrictlyValid**(): `boolean`

Whether if this language tag is strictly valid.

##### Returns

`boolean`

***

### isUndetermined

#### Get Signature

> **get** **isUndetermined**(): `boolean`

Determines if this tag represents the special `undetermined` language.

##### Returns

`boolean`

***

### isValid

#### Get Signature

> **get** **isValid**(): `boolean`

Whether this language tag is valid.

##### Returns

`boolean`

## Methods

### getSuppressedScript()

> **getSuppressedScript**(): [`ScriptSubtag`](../../Iana/namespaces/LanguageSubtags/type-aliases/ScriptSubtag.md) \| `undefined`

Returns the `Suppress-Script` value defined for the primary language of this tag,
regardless of whether a different script is defined in this subtag.

#### Returns

[`ScriptSubtag`](../../Iana/namespaces/LanguageSubtags/type-aliases/ScriptSubtag.md) \| `undefined`

The suppress-script defined for the primary language, or undefined if
the primary language is invalid or has no defined suppressed script.

***

### toCanonical()

> **toCanonical**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

Gets a confirmed canonical representation of this language tag.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

`Success` with a canonical representation of this language tag,
or `Failure` with details if the tag cannot be normalized to canonical form.

***

### toPreferred()

> **toPreferred**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

Gets a confirmed preferred representation of this language tag.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

`Success` with a preferred representation of this language tag,
or `Failure` with details if the tag cannot be normalized to preferred form.

***

### toStrictlyValid()

> **toStrictlyValid**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

Gets a confirmed strictly valid representation of this language tag.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

`Success` with a strictly valid representation of this language tag,
or `Failure` with details if the tag cannot be strictly validated.

***

### toString()

> **toString**(): `string`

Gets a string representation of this language tag.

#### Returns

`string`

A string representation of this language tag.

***

### toValid()

> **toValid**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

Gets a confirmed valid representation of this language tag.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

`Success` with a valid representation of this language tag,
or `Failure` with details if the tag cannot be validated.

***

### \_createTransformed()

> `protected` `static` **\_createTransformed**(`subtags`, `fromValidity`, `fromNormalization`, `partialOptions?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

**`Internal`**

Constructs a new language tag by applying appropriate transformations
to as supplied [Bcp47.Subtags](../namespaces/Subtags/README.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) which represent the tag. |
| `fromValidity` | [`TagValidity`](../type-aliases/TagValidity.md) | The [validation level](../type-aliases/TagValidity.md) of the supplied subtags. |
| `fromNormalization` | [`TagNormalization`](../type-aliases/TagNormalization.md) | The [normalization level](../type-aliases/TagNormalization.md) fo the supplied subtags. |
| `partialOptions?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) | Any [initialization options](../interfaces/ILanguageTagInitOptions.md). |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

`Success` with the corresponding language tag or `Failure`
with details if an error occurs.

***

### \_getOptions()

> `protected` `static` **\_getOptions**(`options?`): `Required`\<[`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md)\>

**`Internal`**

Gets a fully-specified [Bcp47.ILanguageTagInitOptions](../interfaces/ILanguageTagInitOptions.md) from partial or undefined
options, substituting defaults as appropriate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) | The [Bcp47.ILanguageTagInitOptions](../interfaces/ILanguageTagInitOptions.md) to be expanded, or `undefined` for default options. |

#### Returns

`Required`\<[`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md)\>

Fully-specified [init options](../interfaces/ILanguageTagInitOptions.md).

***

### create()

> `static` **create**(`from`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

Creates a new language tag from a supplied `string`
tag or [subtags](../namespaces/Subtags/README.md) using optional configuration,
if supplied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `string` \| [`ISubtags`](../interfaces/ISubtags.md) | The `string` tag or [subtags](../namespaces/Subtags/README.md) from which the language tag is te be constructed. |
| `options?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) | (optional) set of [init options](../interfaces/ILanguageTagInitOptions.md) to guide the validation and normalization of this tag. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

`Success` with the new language tag or `Failure`
with details if an error occurs.

***

### createFromSubtags()

> `static` **createFromSubtags**(`subtags`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

Creates a new language tag from a supplied
[subtags](../namespaces/Subtags/README.md) using optional configuration,
if supplied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) from which the language tag is te be constructed. |
| `options?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) | (optional) set of [init options](../interfaces/ILanguageTagInitOptions.md) to guide the validation and normalization of this tag. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

`Success` with the new language tag or `Failure`
with details if an error occurs.

***

### createFromTag()

> `static` **createFromTag**(`tag`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

Creates a new language tag from a supplied `string` tag
using optional configuration, if supplied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tag` | `string` | The `string` tag from which the language tag is te be constructed. |
| `options?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) | (optional) set of [init options](../interfaces/ILanguageTagInitOptions.md) to guide the validation and normalization of this tag. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTag`\>

`Success` with the new language tag or `Failure`
with details if an error occurs.
