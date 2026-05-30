[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / ValidateTag

# Class: ValidateTag

Validation helpers for BCP-47 language tags.

## Constructors

### Constructor

> **new ValidateTag**(): `ValidateTag`

#### Returns

`ValidateTag`

## Methods

### chooseValidator()

> `static` **chooseValidator**(`wantValidity`, `haveValidity?`): [`ITagValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) \| `undefined`

**`Internal`**

Chooses an appropriate default tag validator given desired and optional current
[validation level](../type-aliases/TagValidity.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `wantValidity` | [`TagValidity`](../type-aliases/TagValidity.md) | The desired [validity level](../type-aliases/TagValidity.md). |
| `haveValidity?` | [`TagValidity`](../type-aliases/TagValidity.md) | (optional) The current [validity level](../type-aliases/TagValidity.md). |

#### Returns

[`ITagValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) \| `undefined`

An appropriate Bcp47.TagValidator \| tag validator or `undefined` if no
additional validation is necessary.

***

### isCanonical()

> `static` **isCanonical**(`subtags`): `boolean`

Determines if supplied [subtags](../namespaces/Subtags/README.md) are in canonical form,
meaning that they are at least well-formed as specified by
[RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9), and
all subtags are also
[capitalized as recommended](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) to test. |

#### Returns

`boolean`

`true` if the [subtags](../namespaces/Subtags/README.md) represent
a language tag in canonical, false otherwise.

#### Examples

```ts
`en-US` is in canonical form, `en-us` is not.
```

```ts
`eng-US` is in canonical form, `eng-us` is not.
```

***

### isInPreferredForm()

> `static` **isInPreferredForm**(`subtags`): `boolean`

Determines if supplied [subtags](../namespaces/Subtags/README.md) are
in preferred form. Preferred form is valid as specified by
[RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9) and
also meets additional preferences specified in the
[language subtag registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry) -
extraneous (suppressed) script tags, deprecated language, extlang, script or region tags or
deprecated grandfathered or redundant tags (with a defined preferred-value) are not allowed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) to test. |

#### Returns

`boolean`

`true` if the [subtags](../namespaces/Subtags/README.md) represent
a valid language tag in preferred form, false otherwise.

#### Examples

```ts
`en-US` is in preferred form, `en-Latn-US` is not.
```

```ts
`cmn` is in preferred form, `zh-cmn-Hans` is not.
```

***

### isStrictlyValid()

> `static` **isStrictlyValid**(`subtags`): `boolean`

Determines if supplied [subtags](../namespaces/Subtags/README.md) are
strictly valid.  A strictly valid tag is both
[valid as defined in the RFC](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9)
and meets any other requirements such as
[prefix validity](https://www.rfc-editor.org/rfc/rfc5646.html#section-3.1.8).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) to test. |

#### Returns

`boolean`

`true` if the [subtags](../namespaces/Subtags/README.md) represent
a strictly valid language tag, false otherwise.

#### Example

```ts
`ca-valencia` is strictly valid, `es-valencia` is not.
```

***

### isValid()

> `static` **isValid**(`subtags`): `boolean`

Determines if supplied [subtags](../namespaces/Subtags/README.md) are
valid as specified by [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9),
meaning that all subtags, or the tag itself for grandfathered tags, are defined in the
[IANA language subtag registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) to test. |

#### Returns

`boolean`

`true` if the [subtags](../namespaces/Subtags/README.md) represent
a valid language tag, false otherwise.

#### Example

```ts
`en-US` is valid, `eng-US` is not.
```

***

### isWellFormed()

> `static` **isWellFormed**(`subtags`): `boolean`

Determines if supplied [subtags](../namespaces/Subtags/README.md) are
well-formed as specified by [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9),
meaning that all subtags meet the grammar defined in the specification.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) to test. |

#### Returns

`boolean`

`true` if the [subtags](../namespaces/Subtags/README.md) represent
a well-formed language tag, false otherwise.

#### Example

```ts
`en-US` is valid, `english-US` is not.
@public
```

***

### validateSubtags()

> `static` **validateSubtags**(`subtags`, `wantValidity`, `haveValidity?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Validates supplied [subtags](../namespaces/Subtags/README.md) to a requested
[validity level](../type-aliases/TagValidity.md), if necessary.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) to be validated. |
| `wantValidity` | [`TagValidity`](../type-aliases/TagValidity.md) | The desired [validity level](../type-aliases/TagValidity.md). |
| `haveValidity?` | [`TagValidity`](../type-aliases/TagValidity.md) | (optional) The current [validity level](../type-aliases/TagValidity.md). |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with the validated [subtags](../namespaces/Subtags/README.md), or
`Failure` with details if an error occurs.
