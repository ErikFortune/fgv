[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IPullModelParams

# Interface: IPullModelParams

Parameters for [pullModel](../functions/pullModel.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-insecure"></a> `insecure?` | `readonly` | `boolean` | Allow pulling from insecure (non-TLS) registries. |
| <a id="property-model"></a> `model` | `readonly` | `string` | Model to pull, e.g. `'llama3.1:8b'`. |
| <a id="property-onprogress"></a> `onProgress?` | `readonly` | (`progress`) => `void` | Progress callback, invoked once per JSON-lines chunk as it arrives. The `Result` returned by [pullModel](../functions/pullModel.md) resolves only after the stream terminates; progress is surfaced here in the interim. A throw from this callback fails the whole pull (it runs inside the captured loop). |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Abort signal. Cancels the in-flight pull; the upstream stream throws an `AbortError`, which surfaces as `Result.fail`. An already-aborted signal cancels immediately. |
