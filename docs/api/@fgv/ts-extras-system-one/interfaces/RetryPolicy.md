[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / RetryPolicy

# Interface: RetryPolicy

Retry configuration. Partial overrides inherit unset fields from the client or SDK defaults.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-apiconnectionerror"></a> `apiConnectionError` | `readonly` | `boolean` | Retry connection failures, including interrupted response bodies (`APIConnectionError`). Default: true. |
| <a id="property-apitimeouterror"></a> `apiTimeoutError` | `readonly` | `boolean` | Whether to retry `APITimeoutError`. Default: true. |
| <a id="property-backoffinitialms"></a> `backoffInitialMs` | `readonly` | `number` | First backoff delay in milliseconds, doubled up to `backoffMaxMs`. Default: 500. |
| <a id="property-backoffjitter"></a> `backoffJitter` | `readonly` | `number` | Fraction of each backoff delay randomly subtracted, from 0 to 1. Default: 0.25. |
| <a id="property-backoffmaxms"></a> `backoffMaxMs` | `readonly` | `number` | Maximum backoff delay in milliseconds. Default: 5000. |
| <a id="property-httpstatuses"></a> `httpStatuses` | `readonly` | `ReadonlySet`\<`number`\> | HTTP status codes to retry. Default: 408, 429, and 500–599. |
| <a id="property-maxretries"></a> `maxRetries` | `readonly` | `number` | Maximum retries after the initial attempt; `0` disables retries. Default: 2. |
| <a id="property-maxretryafterms"></a> `maxRetryAfterMs` | `readonly` | `number` | Maximum server retry delay in milliseconds; longer delays use backoff. Default: 60000. |
| <a id="property-respectretryafter"></a> `respectRetryAfter` | `readonly` | `boolean` | Honor `Retry-After` and `retry-after-ms` up to `maxRetryAfterMs`. Default: true. |
