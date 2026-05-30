[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / NormalizeTag

# Class: NormalizeTag

Normalization helpers for BCP-47 language tags.

## Constructors

### Constructor

> **new NormalizeTag**(): `NormalizeTag`

#### Returns

`NormalizeTag`

## Methods

### chooseNormalizer()

> `static` **chooseNormalizer**(`wantNormalization`, `haveNormalization?`): [`ITagNormalizer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) \| `undefined`

**`Internal`**

Chooses an appropriate default tag normalizer given desired and optional current
[normalization level](../type-aliases/TagNormalization.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `wantNormalization` | [`TagNormalization`](../type-aliases/TagNormalization.md) | The desired [normalization level](../type-aliases/TagNormalization.md). |
| `haveNormalization?` | [`TagNormalization`](../type-aliases/TagNormalization.md) | (optional) The current [normalization level](../type-aliases/TagNormalization.md). |

#### Returns

[`ITagNormalizer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) \| `undefined`

An appropriate Bcp47.TagNormalizer \| tag normalizer or `undefined` if no additional
normalization is necessary.

***

### normalizeSubtags()

> `static` **normalizeSubtags**(`subtags`, `wantNormalization`, `haveNormalization?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISubtags`](../interfaces/ISubtags.md)\>

Normalizes supplied [subtags](../namespaces/Subtags/README.md) to a requested
[normalization level](../type-aliases/TagNormalization.md), if necessary.  If
no normalization is necessary, returns the supplied subtags.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The [subtags](../namespaces/Subtags/README.md) to be normalized. |
| `wantNormalization` | [`TagNormalization`](../type-aliases/TagNormalization.md) | The desired [normalization level](../type-aliases/TagNormalization.md). |
| `haveNormalization?` | [`TagNormalization`](../type-aliases/TagNormalization.md) | (optional) The current [normalization level](../type-aliases/TagNormalization.md). |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISubtags`](../interfaces/ISubtags.md)\>

`Success` with the normalized [subtags](../namespaces/Subtags/README.md), or
`Failure` with details if an error occurs.

***

### toCanonical()

> `static` **toCanonical**(`subtags`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISubtags`](../interfaces/ISubtags.md)\>

Converts a BCP-47 language tag to canonical form.  Canonical form uses the recommended capitalization rules
specified in [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1) but are not
otherwise modified.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The individual [subtags](../namespaces/Subtags/README.md) to be normalized. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISubtags`](../interfaces/ISubtags.md)\>

`Success` with the normalized equivalent [subtags](../namespaces/Subtags/README.md),
or `Failure` with details if an error occurs.

***

### toPreferred()

> `static` **toPreferred**(`subtags`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISubtags`](../interfaces/ISubtags.md)\>

Converts a BCP-47 language tag to preferred form.  Preferred form uses the recommended capitalization rules
specified in [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1) and also
applies additional preferred values specified in the
[language subtag registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry):
extraneous (suppressed) script tags are removed, deprecated language, extlang, script or region tags are replaced
with up-to-date preferred values, and grandfathered or redundant tags with a defined preferred-value are replaced
in their entirety with the new preferred value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtags` | [`ISubtags`](../interfaces/ISubtags.md) | The individual [subtags](../namespaces/Subtags/README.md) to be normalized. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISubtags`](../interfaces/ISubtags.md)\>

`Success` with the normalized equivalent [subtags](../namespaces/Subtags/README.md),
or `Failure` with details if an error occurs.
