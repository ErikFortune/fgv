[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiStreamError

# Interface: IAiStreamError

Terminal failure event for a streaming completion. After this event no
further events are emitted.

## Remarks

Connection-time failures (auth, network, pre-flight CORS rejection) are
surfaced via the outer `Result.fail` returned by
`callProviderCompletionStream` rather than as an `error` event, so callers
can distinguish "didn't start" from "started but errored mid-stream."

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-message"></a> `message` | `readonly` | `string` |
| <a id="property-type"></a> `type` | `readonly` | `"error"` |
