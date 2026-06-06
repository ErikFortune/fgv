[Home](../README.md) > [CandidateValueCollector](./CandidateValueCollector.md) > create

## CandidateValueCollector.create() method

Creates a new Resources.CandidateValueCollector object.

**Signature:**

```typescript
static create(params?: ICandidateValueCollectorCreateParams): Result<CandidateValueCollector>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ICandidateValueCollectorCreateParams</td><td>Parameters to create the collector.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[CandidateValueCollector](CandidateValueCollector.md)&gt;

`Success` with the new collector if successful,
or `Failure` with an error message if not.
