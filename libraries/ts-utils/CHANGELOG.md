# Change Log - @fgv/ts-utils

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Breaking changes

- Upgrading from 5.0.2: `Converter` and `Validator` gained a required `or()`, and `IResult` gained required `orDefaultWith`, `shouldNotFail`, `thenOnSuccess` and `thenOnFailure`. Only code that implements these interfaces by hand is affected — extending `BaseConverter` / `GenericValidator` or using `succeed` / `fail` needs no change.

### Minor changes

- Async `Result` support: `AsyncResult<T>`, returned by the new `captureAsyncResult` and by `thenOnSuccess` / `thenOnFailure` on every `Result`, keeps a chain fluent across `await`; `AsyncDetailedResult<T, TD>` keeps the detail type through async steps.
- Async collectors with a concurrency bound — `mapResultsAsync`, `mapDetailedResultsAsync`, `mapSuccessAsync`, `mapFailuresAsync`, `allSucceedAsync` — plus the serial `populateObjectAsync` and `firstSuccessAsync`.
- New `Result` methods: `orDefaultWith(cb)`, a default computed only on failure; `shouldNotFail(label?)` for declaration-time invariants, which throws naming the call site; and `Failure.withType<U>()` to re-type a failure for an early return. `DetailedResult` is now `@public` (was `@beta`).
- Conversion: `or()` alternation on `Converter` and `Validator`, `Converters.tuple`, `Converters.compositeId` / `compositeIdFromString` / `compositeIdFromObject` (with a `split` mode), and `StringConverter.singleLine()`.
- New `formatValueForMessage` renders any value for a message without throwing. Every converter and validator failure now uses it, so a cyclic, BigInt or Proxy input fails instead of throwing, and a throw from a function wrapped by `BaseConverter` or `GenericValidator` becomes a `Failure`.
- Collections: `IResultMap` (implemented by `ResultMap`), `ConvertingResultMap` and `ValidatingConvertingResultMap`, `AggregatedResultMap`, and `RetainingRingBuffer<T>`, a bounded most-recent-N buffer with monotonic `seq` cursor paging.
- Logging: `BootLogger` buffers output until a real logger is ready, `RetainingLogger` keeps a queryable ring of structured log records, `MultiLogger` fans out to several loggers; `MessageLogLevel` and `ReporterLogLevel` gain value lists and converters.
- Utilities: `generateUuid()` with the `Uuid` brand and `isValidUuid`; `canonicalize()` on `Normalizer` for RFC 8785 canonical JSON; `OneOf` / `StringOneOf` types; typed record helpers `keysForRecord`, `valuesForRecord`, `entriesForRecord`, `recordFromEntries`; `ensureArray`.

### Patches

- `captureResult` and the async capture paths never throw while reporting a failure, even when the thrown value's message cannot be read.
- Packaging: source maps and `CAPABILITIES.md` now ship in the package; test helper files no longer do.
- Upgrading from 5.0.2: behaviour fixes you may notice. `mapSuccess` now matches its documented contract, adding every failure to a supplied `aggregatedErrors` even when some results succeeded; `isKeyOf` and `Converters.strictObject` no longer throw on null-prototype objects.
- Upgrading from 5.0.2: Node ESM `import` of this package now works; in 5.0.2 it failed with `ERR_UNSUPPORTED_DIR_IMPORT`. `require` and bundlers are unaffected.

## 5.0.2
Wed, 17 Dec 2025 18:08:09 GMT

### Updates

- dual-publish
- add variance annotations to result types
- minor additions
- work around apparent babel bug

## 5.0.1
Tue, 23 Sep 2025 03:13:55 GMT

_Version update only_

## 5.0.0
Tue, 23 Sep 2025 02:54:20 GMT

### Updates

- various collection and result improvements
- logging improvements (breaking)
- update rushstack

## 4.6.0
Wed, 02 Jul 2025 05:48:16 GMT

_Version update only_

## 4.5.1
Wed, 02 Jul 2025 05:47:11 GMT

### Updates

- use IterableIterator instead of MapIterator
- update rushstack

## 4.5.0
Tue, 01 Jul 2025 03:26:11 GMT

### Minor changes

- add recordOf validator for validating Record<string, T> objects

### Updates

- update collectors
- rework collections for better usability

## 4.4.0
Sat, 01 Feb 2025 17:13:10 GMT

_Version update only_

## 4.3.0
Thu, 30 Jan 2025 00:35:17 GMT

### Updates

- add collector, convertingResultMap, convertingCollector

## 4.2.2
Thu, 23 Jan 2025 06:19:32 GMT

### Updates

- QoL improvements to Success/Failure

## 4.2.1
Tue, 21 Jan 2025 04:19:21 GMT

### Updates

- allow factories in getOrAdd

## 4.2.0
Mon, 20 Jan 2025 09:46:53 GMT

### Updates

- add collections packlet and ResultMap class
- add withFormattedError on validator and converter
- clean up type inconsistencies, relax some constraints

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
- import TextEncoder to avoid globals race

## 4.0.0
Tue, 14 May 2024 03:09:27 GMT

### Updates

- rework validation/converter compatibility a bit
- QoL improvement to simplify error aggregation
- factor optional converters out to ts-extras package to eliminate large dependencies
- update generated api docs
- add convalidate helper
- add defaulting converter
- extend conversion to accept validators
- export StringConverter at top level

## 3.0.0
Mon, 22 Jan 2024 07:00:18 GMT

### Updates

- gitignore tweaks
- refactor hash implementation
- bump versions
- refactor and cleanup
- build changes
- Factor out extras, enable shaking
- bump dependencies
- version upgrades
- relax mapToRecord from Map to ReadonlyMap
- bump version
- add oneOf validator

## 2.0.0
Mon, 10 Apr 2023 03:33:11 GMT

### Breaking changes

- refactor and cleanup
- reorganization and cleanup
- more refactoring
- refactor

