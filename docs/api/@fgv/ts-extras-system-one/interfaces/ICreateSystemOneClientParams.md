[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ICreateSystemOneClientParams

# Interface: ICreateSystemOneClientParams

Parameters for [createSystemOneClient](../functions/createSystemOneClient.md).

## Remarks

Every value that the SDK would otherwise read from a `TYPESAFE_*` environment variable is
passed explicitly, so the composition root, never the process environment, chooses the server,
the model, the key and the log level.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-apikey"></a> `apiKey` | `readonly` | `string` | API key, sent as a bearer token. `''` is allowed, for a keyless local server. |
| <a id="property-baseurl"></a> `baseUrl` | `readonly` | `string` | Absolute `http:` or `https:` URL of the System-1 server (for example `http://127.0.0.1:8700`). |
| <a id="property-fetch"></a> `fetch?` | `readonly` | [`Fetch`](../type-aliases/Fetch.md) | A `fetch` implementation, in place of the global `fetch`. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Logger for the SDK's request summaries. With no logger, the SDK logs nothing. This package never sets the SDK's level to `debug`, at which the SDK logs request bodies. The SDK's level is taken from `logger.logLevel` once, when the client is created, and must be one of ts-utils' `ReporterLogLevel` values. |
| <a id="property-model"></a> `model` | `readonly` | `string` | Model id sent with every request (for example `clm-latest`, `clm-v0.1` or `jev-latest`). It is trimmed, and the trimmed value is what is sent. |
| <a id="property-retry"></a> `retry?` | `readonly` | `Partial`\<[`RetryPolicy`](RetryPolicy.md)\> | Overrides for the SDK's retry policy. |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Timeout per attempt, in milliseconds; the SDK's default is 10,000. There is no total budget across retries: with the SDK's default policy (2 retries, `Retry-After` honoured up to 60 s), one call can take well over 30 seconds. |
