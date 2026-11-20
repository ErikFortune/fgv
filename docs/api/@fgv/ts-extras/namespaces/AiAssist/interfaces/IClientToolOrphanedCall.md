[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IClientToolOrphanedCall

# Interface: IClientToolOrphanedCall

A tool call the round in flight at a stop had handed off for dispatch: the runner saw its
`client-tool-call-done` event. That round is discarded, so the host never receives this call in
a recorded round, whether or not it ran.

## Remarks

`settled: true` means the call's `client-tool-result` was seen: the tool ran to a result (or was
declined with one), and its side effects, if any, have happened. `settled: false` means no result
was seen: the tool may still be running, may have finished after the stop, or may never have
started.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The call's arguments as the model sent them. |
| <a id="property-callid"></a> `callId?` | `readonly` | `string` | Provider-assigned call identifier (absent for Gemini). |
| <a id="property-iserror"></a> `isError?` | `readonly` | `boolean` | The seen result's `isError`; present only when `settled`. |
| <a id="property-settled"></a> `settled` | `readonly` | `boolean` | Whether the call's `client-tool-result` was seen before the stop. |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | The name of the tool the model called. |
