<div align="center">
  <h1>@fgv/ts-bcp47</h1>
  Typescript Utilities for BCP-47 Language Tags
</div>

<hr/>

## Summary

Typescript utilities for parsing, manipulating and comparing BCP-47 language tags.

## Installation

with npm:
```sh
npm install @fgv/ts-bcp47
```

## API Documentation
Extracted API documentation is [here](./docs/ts-bcp47.md)

## Overview

Classes and functions to:
- parse and validate BCP-47 ([RFC 5646](https://www.rfc-editor.org/rfc/rfc5646)) language tags
- normalize BCP-47 language tags into [canonical](#canonical-form) or [preferred form](#preferred-form).
- compare BCP-47 language tags

### TL; DR
For those who already understand BCP-47 language tags and just want to get started, here are a few examples:
```ts
import { Bcp47 } from '@fgv/ts-bcp47';

// parse a tag to extract primary language and region
const {primaryLanguage, region} = Bcp47.tag('en-us').orThrow().subtags;
// primaryLanguage is 'en', region is 'us'

// parse a tag to extract primary language and region in canonical form
const {primaryLanguage, region} = Bcp47.tag('en-us', { normalization: 'canonical' }).orThrow().subtags;
// primary language is 'en', region is 'US'

// normalize a tag to fully-preferred form
const preferred = Bcp47.tag('art-lojban', { normalization: 'preferred' }).orThrow().tag;
// preferred is "jbo"

// tags match regardless of case
const match = Bcp47.similarity('es-MX', 'es-mx').orThrow(); // 1.0 (exact)

// suppressed script matches explicit script
const match = Bcp47.similarity('es-MX', 'es-latn-mx').orThrow(); // 1.0 (exact)

// macro-region matches contained region well
const match = Bcp47.similarity('es-419', 'es-MX').orThrow(); // 0.7 (macroRegion)
const match = Bcp47.similarity('es-419', 'es-ES').orThrow(); // 0.3 (sibling)

// region matches neutral fairly well
const match = Bcp47.similarity('es', 'es-MX').orThrow(); // 0.6 (neutral)

// unlike tags do not match
const match = Bcp47.similarity('en', 'es').orThrow(); // 0.0 (none)

// different scripts do not match
const match = Bcp47.similarity('zh-Hans', 'zh-Hant').orThrow(); // 0.0 (none)
```

*Note:* This library uses the `Result` pattern, so the return value from any method that might fail is a `Result` object that must be tested for success or failure.  These examples use either [orThrow](https://github.com/DidjaRedo/ts-utils/blob/master/docs/ts-utils.iresult.orthrow.md) or [orDefault](https://github.com/DidjaRedo/ts-utils/blob/master/docs/ts-utils.iresult.ordefault.md) to convert an error result to either an exception or undefined.

### Anatomy of a BCP-47 language tag.
As specified in [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646), a language tag consists of a series of `subtags` (mostly optional), each of which describes some aspect of the language being referenced.

#### Subtags
The full set of subtags that make up a language tag are:
- [primary language](https://www.rfc-editor.org/rfc/rfc5646#section-2.2.1)
- [extlang](https://www.rfc-editor.org/rfc/rfc5646#section-2.2.2)
- [script](https://www.rfc-editor.org/rfc/rfc5646#section-2.2.3)
- [region](https://www.rfc-editor.org/rfc/rfc5646#section-2.2.4)
- [variants](https://www.rfc-editor.org/rfc/rfc5646#section-2.2.4)
- [extensions](https://www.rfc-editor.org/rfc/rfc5646#section-2.2.6)
- [private-use](https://www.rfc-editor.org/rfc/rfc5646#section-2.2.7)

#### Grandfathered Tags
The RFC allows for a handful of grandfathered tags which do not meet the current specification.  Those tags are recognized in their entirety and are not composed of subtags, so for grandfathered tags only, even `primary language` is undefined.

### Validation
Tag validation considers the tag in its current form and never changes the tag itself.

The specification defines two levels of [conformance](https://www.rfc-editor.org/rfc/rfc5646#section-2.2.9) for language, and this library defines a third.
#### Well-Formed Tags
A `well-formed` tag meets the basic syntactic requirements of the specification, but might not be valid in terms of content.
#### Valid Tags
A `valid` tag meets both the syntactic and semantic requirements of the specification, meaning that either all subtags or full tag (in the case of grandfathered tags) are registered in the [IANA language subtag registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry), and neither extension nor variant tags are repeated.
#### Strictly Valid Tags
A `strictly valid` tags is valid according to the specification and also meets the rules for variant and extlang prefixes defined by the specification and recorded in the language registry.
#### Examples
Some examples:
- `eng-US` is well-formed because it meets the language tag syntax but is not valid because `eng` is not a registered language subtag.
- `en-US` is both well-formed and valid, because `en` is a registered language subtag.
- `es-valencia-valencia` is well-formed but not valid, because the `valencia` extension subtag is repeated.
- `es-valencia` is well-formed and valid, but it is not strictly-valid because language subtag registry defines a `ca` prefix for the `valencia` subtag.
- `ca-valencia` is well-formed, valid, and strictly valid.

### Normalization
Normalization transforms a tag to produce a new tag which is semantically identical, but preferred for some reason.
#### Not-normalized
A non-normalized must be [`well-formed`](#well-formed-tags) and might be [`valid`](#valid-tags) or [`strictly-valid`](#strictly-valid-tags) but it does not use the letter case conventions recommended in the spec.

#### Canonical Form
A tag in canonical form meets all of the letter case conventions recommended by the specification, in addition to being at least [`well-formed`](#well-formed-tags).

#### Preferred Form
In addition to being [`strictly-valid`](#strictly-valid-tags) and [canonical](#canonical-form), tags
in preferred form do not have any deprecated, redundant or suppressed subtags.

#### Examples
- `zh-cmn-hans` is strictly valid, but not canonical or preferred.
- `zh-cmn-Hans` is strictly valid and canonical, but not preferred, because the subtag registry lists `zh-cmn-Hans` as redundant, with the preferred value `cmn-Hans`.
- `cmn-Hans` is strictly valid, canonical and preferred.
- `en-latn-us` is strictly valid, but not canonical or preferred.
- `en-Latn-US` is strictly valid and canonical, but not preferred, because the subtag registry lists `Latn` as the suppressed script for the `en` language.
- `en-US` is strictly valid, canonical and preferred.

### Tag Matching
The [`match`](docs/ts-bcp47.bcp47.match.md) function matches language tags, using semantic similarity, unlike [RFC 4647](https://www.rfc-editor.org/rfc/rfc4647.html), which relies on purely syntactic rules.  This semantic match yields much better results in many cases.

For any given language tag pair, the `match` function returns a similarity score in the range `0.0` (no similarity) to `1.0` (exact match).

The degrees of similarity are (from most to least similar):
- `exact` (`1.0`) - The two language tags are semantically identical.
- `variant` (`0.9`) - The tags vary only in extension or private subtags.
- `region` (`0.8`) - The tags match on language, script and region but vary in variant, extension or private-use subtags.
- `macroRegion` (`0.7`) - The tags match on language and script, and one of the region subtags is a macro-region (e.g. `419` for Latin America) which encompasses the second region tag.
- `neutralRegion` (`0.6`) - The tags match on language and script, and only one of the tags contains a region subtag.
- `affinity` (`0.5`) - The tags match on language and script, and two region subtags have an orthographic affinity.  Orthographic affinity is defined in this package in the [`overrides.json`](./data/bcp/overrides.json) file.
- `preferredRegion` (`0.4`) - The tags match on language and script, and one of the tags is the preferred region subtag for the language.  Preferred region is also defined in this package in [`overrides.json`](./data/bcp/overrides.json).
- `sibling` (`0.3`) - The tags match on language and script but both have region tags that are otherwise unrelated.
- `undetermined` (`0.2`) - One of the languages is the special language `und`.
- `none` (`0.0`) - The tags do not match at all.

## See Also
[RFC 5646 - Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646)
[IANA Language Subtag Registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)