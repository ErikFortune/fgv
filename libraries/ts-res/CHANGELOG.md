# Change Log - @fgv/ts-res

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Breaking changes

- Upgrading from 5.0.2: `ResourceJson.Json.ConditionSetDeclAsRecord` is now readonly and partial. Code that builds one by assigning keys one at a time must build a `Record<string, …>` and assign it whole.
- Upgrading from 5.0.2: `QualifierCollector`'s protected constructor now takes `(qualifierTypes, qualifiers?)` instead of `(params)`; a subclass calling `super(params)` must pass the two values.

### Minor changes

- Qualifier-name-typed declarations: the resource and condition declaration types take an optional `TQualifierNames` parameter (default `string`), and matching `typed*` converters such as `ResourceJson.Convert.typedResourceTreeRootDecl(qualifierNameConverter)` validate qualifier names at load time.
- Importers accept `fileContentConverter` and `fileContentExtensions`, so resource files in another format — YAML, for example — can be imported.
- `QualifierCollector.create` accepts qualifier names as plain strings alongside full declarations (`qualifierTypes` is optional when every entry is a string), and the simple context qualifier providers accept partial `qualifierValues`.

### Patches

- Packaging: `CAPABILITIES.md` and source maps now ship in the package; test helper files no longer do.

## 5.0.2
Wed, 17 Dec 2025 18:08:09 GMT

### Updates

- dual-publish
- minor cleanup

## 5.0.1
Tue, 23 Sep 2025 03:13:55 GMT

_Version update only_

## 5.0.0
Tue, 23 Sep 2025 02:54:20 GMT

### Updates

- Added ResourceTreeResolver
- multidimensional resource loader - initial checkin

## 5.0.0
Thu, 17 Jul 2025 00:13:24 GMT

### Updates

- add decl generators
- fix merge errors
- flesh out tests
- initial checkin

