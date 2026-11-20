[Home](../README.md) > IRetryPolicy

# Interface: IRetryPolicy

Opt-in retry policy.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[attempts](./IRetryPolicy.attempts.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Additional attempts after the first, **not** a total.

</td></tr>
<tr><td>

[baseDelayMs](./IRetryPolicy.baseDelayMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

First backoff delay, in milliseconds, doubled per attempt before jitter.

</td></tr>
<tr><td>

[maxDelayMs](./IRetryPolicy.maxDelayMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Ceiling on any single delay, in milliseconds.

</td></tr>
<tr><td>

[retryNonIdempotent](./IRetryPolicy.retryNonIdempotent.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Retries `POST` / `PUT` / `PATCH` / `DELETE` as well as `GET` / `HEAD`.

</td></tr>
<tr><td>

[respectRetryAfter](./IRetryPolicy.respectRetryAfter.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Honors a `Retry-After` header on `429` and `503`.

</td></tr>
</tbody></table>
