# Change Log - @fgv/ts-json-base

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- New `JsonSchema` namespace: typed JSON Schema for LLM tools and structured output, where the schema is also the validator — `string`, `number`, `integer`, `boolean`, `enumOf`, `array`, `object`, `record` and `optional`, with `nullable`, constraint and annotation keywords, `Static<S>` type inference and `toJson()`.
- `JsonSchema.fromJson` turns a received schema (for example an MCP tool's) into a validator: it inlines local `$ref`, accepts a pydantic-style `anyOf` of one type plus null, and refuses `pattern` unless a `patternValidator` is supplied. `JsonSchema.isSchemaValidator` detects an authored schema.
- Writable `FileTree`s: optional mutable, persistent, binary, strict-text and atomic-write capabilities, each with a type guard (`isMutableAccessors`, `isBinaryAccessors`, …). Filesystem and in-memory trees are writable when created with `mutable: true` (or a filter).
- `FileTree.copyItemInto` / `copyContentsInto` copy between trees faithfully — bytes verbatim where the destination is byte-native — and fail, or skip with `onUnfaithfulFile: 'skip'`, on any file that would change.
- Filesystem trees: atomic writes (temporary file, flush, rename) via `writeChildAtomically`, and an `absolutePathPolicy` (`'unconfined'` default, `'confined'` or `'verified'`) to keep a tree inside its prefix.
- `Converters.stringifiedJson(inner?)` parses a JSON string, optionally validating the result with an inner converter or validator.

### Patches

- Fix: the recursive `jsonObject`, `jsonArray` and `jsonValue` converters and validators fail on a cyclic input instead of overflowing the stack, and failure messages render the offending value safely.
- Packaging: source maps and `CAPABILITIES.md` now ship in the package; a test helper file no longer does.

## 5.0.2
Wed, 17 Dec 2025 18:08:09 GMT

### Updates

- dual-publish
- add converters that take json context
- minor cleanup
- export JsonCompatible for web consumers as well

## 5.0.1
Tue, 23 Sep 2025 03:13:55 GMT

_Version update only_

## 5.0.0
Tue, 23 Sep 2025 02:54:20 GMT

### Updates

- FileTree moved from ts-utils and to use JsonTypes
- update rushstack

## 4.6.0
Wed, 02 Jul 2025 05:48:16 GMT

_Version update only_

## 4.5.1
Wed, 02 Jul 2025 05:47:11 GMT

### Updates

- update rushstack

## 4.5.0
Tue, 01 Jul 2025 03:26:11 GMT

_Version update only_

## 4.4.0
Sat, 01 Feb 2025 17:13:10 GMT

_Version update only_

## 4.3.0
Thu, 30 Jan 2025 00:35:17 GMT

_Version update only_

## 4.2.2
Thu, 23 Jan 2025 06:19:32 GMT

_Version update only_

## 4.2.1
Tue, 21 Jan 2025 04:19:21 GMT

_Version update only_

## 4.2.0
Mon, 20 Jan 2025 09:46:53 GMT

### Updates

- plumb conversion context through

## 4.1.0
Thu, 09 Jan 2025 05:33:39 GMT

### Updates

- update dependencies

## 4.0.2
Tue, 14 May 2024 14:45:53 GMT

_Version update only_

## 4.0.1
Tue, 14 May 2024 05:02:20 GMT

### Updates

- publish

## 4.0.0
Tue, 14 May 2024 03:09:27 GMT

### Updates

- clean up and renaming in JSON file helpers
- update generated api docs
- generalize fs helper to enable yaml

## 3.0.0
Mon, 22 Jan 2024 07:00:18 GMT

### Updates

- add validators
- initial refactor

## 2.2.0
Thu, 18 Jan 2024 05:45:04 GMT

### Updates

- initial refactor

