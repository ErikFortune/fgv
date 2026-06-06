# @fgv/ts-utils

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Collections](./Collections/README.md)

</td><td>



</td></tr>
<tr><td>

[Conversion](./Conversion/README.md)

</td><td>



</td></tr>
<tr><td>

[Converters](./Converters/README.md)

</td><td>



</td></tr>
<tr><td>

[Hash](./Hash/README.md)

</td><td>



</td></tr>
<tr><td>

[Logging](./Logging/README.md)

</td><td>



</td></tr>
<tr><td>

[Validation](./Validation/README.md)

</td><td>



</td></tr>
<tr><td>

[Validators](./Validators/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[MessageAggregator](./classes/MessageAggregator.md)

</td><td>

A simple error aggregator to simplify collecting and reporting all errors in

</td></tr>
<tr><td>

[Success](./classes/Success.md)

</td><td>

Reports a successful IResult | result from some operation and the

</td></tr>
<tr><td>

[Failure](./classes/Failure.md)

</td><td>

Reports a failed IResult | result from some operation, with an error message.

</td></tr>
<tr><td>

[DetailedSuccess](./classes/DetailedSuccess.md)

</td><td>

A DetailedSuccess | DetailedSuccess extends Success | Success to report optional success

</td></tr>
<tr><td>

[DetailedFailure](./classes/DetailedFailure.md)

</td><td>

A DetailedFailure | DetailedFailure<T, TD> extends Failure | Failure<T> to report optional

</td></tr>
<tr><td>

[AsyncResult](./classes/AsyncResult.md)

</td><td>

Wraps a `Promise` of a Result to enable fluent chaining of both

</td></tr>
<tr><td>

[AggregatedResultMap](./classes/AggregatedResultMap.md)

</td><td>

An aggregated result map that wraps a collection of ValidatingResultMap | ValidatingResultMap instances,
keyed by collection ID.

</td></tr>
<tr><td>

[Normalizer](./classes/Normalizer.md)

</td><td>

Normalizes an arbitrary JSON object

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[PopulateObjectOptions](./interfaces/PopulateObjectOptions.md)

</td><td>

Options for the populateObject function.

</td></tr>
<tr><td>

[IResultLogger](./interfaces/IResultLogger.md)

</td><td>

Simple logger interface used by IResult.orThrow | orThrow(logger) and IResult.orThrow | orThrow(formatter).

</td></tr>
<tr><td>

[IMessageReportDetail](./interfaces/IMessageReportDetail.md)

</td><td>

Details for reporting a message.

</td></tr>
<tr><td>

[IResultReportOptions](./interfaces/IResultReportOptions.md)

</td><td>

Options for reporting a result.

</td></tr>
<tr><td>

[IResultReporter](./interfaces/IResultReporter.md)

</td><td>

Interface for reporting a result.

</td></tr>
<tr><td>

[IMessageAggregator](./interfaces/IMessageAggregator.md)

</td><td>

Simple error aggregator to simplify collecting all errors in

</td></tr>
<tr><td>

[IResult](./interfaces/IResult.md)

</td><td>

Represents the result of some operation of sequence of operations.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Brand](./type-aliases/Brand.md)

</td><td>

Helper type to brand a simple type to prevent inappropriate use

</td></tr>
<tr><td>

[FieldInitializers](./type-aliases/FieldInitializers.md)

</td><td>

String-keyed record of initialization functions to be passed to populateObject

</td></tr>
<tr><td>

[Result](./type-aliases/Result.md)

</td><td>

Represents the IResult | result of some operation or sequence of operations.

</td></tr>
<tr><td>

[DeferredResult](./type-aliases/DeferredResult.md)

</td><td>

Represents a deferred result that will be evaluated if needed.

</td></tr>
<tr><td>

[SuccessContinuation](./type-aliases/SuccessContinuation.md)

</td><td>

Continuation callback to be called in the event that an

</td></tr>
<tr><td>

[FailureContinuation](./type-aliases/FailureContinuation.md)

</td><td>

Continuation callback to be called in the event that an

</td></tr>
<tr><td>

[ResultValueType](./type-aliases/ResultValueType.md)

</td><td>

Type inference to determine the result type of an Result.

</td></tr>
<tr><td>

[IResultValueType](./type-aliases/IResultValueType.md)

</td><td>

Type inference to determine the result type of an IResult.

</td></tr>
<tr><td>

[ResultMapValueType](./type-aliases/ResultMapValueType.md)

</td><td>

Type inference to determine the value type returned from a result-map style

</td></tr>
<tr><td>

[ErrorFormatter](./type-aliases/ErrorFormatter.md)

</td><td>

Formats an error message.

</td></tr>
<tr><td>

[MessageLogLevel](./type-aliases/MessageLogLevel.md)

</td><td>

The severity level at which a message should be logged.

</td></tr>
<tr><td>

[DetailedSuccessContinuation](./type-aliases/DetailedSuccessContinuation.md)

</td><td>

Callback to be called when a DetailedResult | DetailedResult encounters success.

</td></tr>
<tr><td>

[DetailedFailureContinuation](./type-aliases/DetailedFailureContinuation.md)

</td><td>

Callback to be called when a DetailedResult | DetailedResult encounters a failure.

</td></tr>
<tr><td>

[DetailedResult](./type-aliases/DetailedResult.md)

</td><td>

Represents a result with additional detail.

</td></tr>
<tr><td>

[DetailedResultValueType](./type-aliases/DetailedResultValueType.md)

</td><td>

Type inference to determine the result type `T` of a DetailedResult | DetailedResult<T, TD>.

</td></tr>
<tr><td>

[ResultDetailType](./type-aliases/ResultDetailType.md)

</td><td>

Type inference to determine the detail type `TD` of a DetailedResult | DetailedResult<T, TD>.

</td></tr>
<tr><td>

[AsyncSuccessContinuation](./type-aliases/AsyncSuccessContinuation.md)

</td><td>

Async continuation callback to be called in the event that a

</td></tr>
<tr><td>

[AsyncFailureContinuation](./type-aliases/AsyncFailureContinuation.md)

</td><td>

Async continuation callback to be called in the event that a

</td></tr>
<tr><td>

[OneOf](./type-aliases/OneOf.md)

</td><td>

Union of all values in an array/tuple type, preserving literal types if possible.

</td></tr>
<tr><td>

[StringOneOf](./type-aliases/StringOneOf.md)

</td><td>

Union of all string values in an array/tuple type, preserving literal types if possible.

</td></tr>
<tr><td>

[EnsureArrayResult](./type-aliases/EnsureArrayResult.md)

</td><td>

Helper type to extract the element type and preserve readonly status.

</td></tr>
<tr><td>

[Uuid](./type-aliases/Uuid.md)

</td><td>

A canonical UUIDv4 string: 8-4-4-4-12 lowercase hex digits with version
nibble `4` and variant nibble in `[89ab]`.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[mapResults](./functions/mapResults.md)

</td><td>

Aggregates successful result values from a collection of Result | Result<T>.

</td></tr>
<tr><td>

[mapDetailedResults](./functions/mapDetailedResults.md)

</td><td>

Aggregates successful results from a collection of DetailedResult | DetailedResult<T, TD>,

</td></tr>
<tr><td>

[mapSuccess](./functions/mapSuccess.md)

</td><td>

Aggregates successful results from a a collection of Result | Result<T>.

</td></tr>
<tr><td>

[mapFailures](./functions/mapFailures.md)

</td><td>

Aggregates error messages from a collection of Result | Result<T>.

</td></tr>
<tr><td>

[allSucceed](./functions/allSucceed.md)

</td><td>

Determines if an iterable collection of Result | Result<T> were all successful.

</td></tr>
<tr><td>

[firstSuccess](./functions/firstSuccess.md)

</td><td>

Returns the first successful result from a collection of Result | Result<T> or DeferredResult | DeferredResult<T>.

</td></tr>
<tr><td>

[populateObject](./functions/populateObject.md)

</td><td>

Populates an an object based on a prototype full of field initializers that return Result | Result<T[key]>.

</td></tr>
<tr><td>

[isDeferredResult](./functions/isDeferredResult.md)

</td><td>

Checks if a result is a deferred result.

</td></tr>
<tr><td>

[succeed](./functions/succeed.md)

</td><td>

Returns Success | Success<T> with the supplied result value.

</td></tr>
<tr><td>

[succeeds](./functions/succeeds.md)

</td><td>

Returns Success | Success<T> with the supplied result value.

</td></tr>
<tr><td>

[fail](./functions/fail.md)

</td><td>

Returns Failure | Failure<T> with the supplied error message.

</td></tr>
<tr><td>

[fails](./functions/fails.md)

</td><td>

Returns Failure | Failure<T> with the supplied error message.

</td></tr>
<tr><td>

[useOrInitialize](./functions/useOrInitialize.md)

</td><td>

Uses a value or calls a supplied initializer if the supplied value is undefined.

</td></tr>
<tr><td>

[succeedWithDetail](./functions/succeedWithDetail.md)

</td><td>

Returns DetailedSuccess | DetailedSuccess<T, TD> with a supplied value and optional

</td></tr>
<tr><td>

[succeedsWithDetail](./functions/succeedsWithDetail.md)

</td><td>

Returns DetailedSuccess | DetailedSuccess<T, TD> with a supplied value and optional

</td></tr>
<tr><td>

[failWithDetail](./functions/failWithDetail.md)

</td><td>

Returns DetailedFailure | DetailedFailure<T, TD> with a supplied error message and detail.

</td></tr>
<tr><td>

[failsWithDetail](./functions/failsWithDetail.md)

</td><td>

Returns DetailedFailure | DetailedFailure<T, TD> with a supplied error message and detail.

</td></tr>
<tr><td>

[propagateWithDetail](./functions/propagateWithDetail.md)

</td><td>

Propagates a Success or Failure Result, adding supplied

</td></tr>
<tr><td>

[captureResult](./functions/captureResult.md)

</td><td>

Wraps a function which might throw to convert exception results

</td></tr>
<tr><td>

[captureAsyncResult](./functions/captureAsyncResult.md)

</td><td>

Wraps an async function which might throw to convert exception results

</td></tr>
<tr><td>

[isKeyOf](./functions/isKeyOf.md)

</td><td>

Helper type-guard function to report whether a specified key is present in

</td></tr>
<tr><td>

[pick](./functions/pick.md)

</td><td>

Simple implicit pick function, which picks a set of properties from a supplied
object.

</td></tr>
<tr><td>

[omit](./functions/omit.md)

</td><td>

Simple implicit omit function, which picks all of the properties from a supplied

</td></tr>
<tr><td>

[keysForRecord](./functions/keysForRecord.md)

</td><td>

Type-safe(ish) key extractor for typed records.

</td></tr>
<tr><td>

[valuesForRecord](./functions/valuesForRecord.md)

</td><td>

Type-safe(ish) value extractor for typed records.

</td></tr>
<tr><td>

[entriesForRecord](./functions/entriesForRecord.md)

</td><td>

Type-safe(ish) entries extractor for typed records.

</td></tr>
<tr><td>

[recordFromEntries](./functions/recordFromEntries.md)

</td><td>

Type-safe(ish) record constructor from an iterable of `[key, value]` tuples.

</td></tr>
<tr><td>

[ensureArray](./functions/ensureArray.md)

</td><td>

Ensures the input is an array.

</td></tr>
<tr><td>

[getValueOfPropertyOrDefault](./functions/getValueOfPropertyOrDefault.md)

</td><td>

Gets the value of a property specified by key from an arbitrary object,

</td></tr>
<tr><td>

[getTypeOfProperty](./functions/getTypeOfProperty.md)

</td><td>

Gets the type of a property specified by key from an arbitrary object.

</td></tr>
<tr><td>

[recordToMap](./functions/recordToMap.md)

</td><td>

Applies a factory method to convert a `Record<TK, TS>` into a `Map<TK, TD>`.

</td></tr>
<tr><td>

[optionalRecordToMap](./functions/optionalRecordToMap.md)

</td><td>

Applies a factory method to convert an optional `Record<TK, TS>` into a `Map<TK, TD>`, or `undefined`.

</td></tr>
<tr><td>

[optionalRecordToPossiblyEmptyMap](./functions/optionalRecordToPossiblyEmptyMap.md)

</td><td>

Applies a factory method to convert an optional `Record<TK, TS>` into a `Map<TK, TD>`

</td></tr>
<tr><td>

[mapToRecord](./functions/mapToRecord.md)

</td><td>

Applies a factory method to convert a `ReadonlyMap<TK, TS>` into a `Record<TK, TD>`.

</td></tr>
<tr><td>

[optionalMapToRecord](./functions/optionalMapToRecord.md)

</td><td>

Applies a factory method to convert an optional `ReadonlyMap<string, TS>` into a `Record<string, TD>` or `undefined`.

</td></tr>
<tr><td>

[optionalMapToPossiblyEmptyRecord](./functions/optionalMapToPossiblyEmptyRecord.md)

</td><td>

Applies a factory method to convert an optional `ReadonlyMap<string, TS>` into a `Record<string, TD>`

</td></tr>
<tr><td>

[isValidUuid](./functions/isValidUuid.md)

</td><td>

Type guard that returns `true` when the input is a canonical UUIDv4 string.

</td></tr>
<tr><td>

[generateUuid](./functions/generateUuid.md)

</td><td>

Generates a cryptographically random UUIDv4 using the platform's Web Crypto
API (`globalThis.crypto.randomUUID`).

</td></tr>
</tbody></table>
