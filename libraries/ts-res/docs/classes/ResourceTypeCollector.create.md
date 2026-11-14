[Home](../README.md) > [ResourceTypeCollector](./ResourceTypeCollector.md) > create

## ResourceTypeCollector.create() method

Creates a new ResourceTypes.ResourceTypeCollector | ResourceTypeCollector.

**Signature:**

```typescript
static create(params?: IResourceCollectorCreateParams): Result<ResourceTypeCollector>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IResourceCollectorCreateParams</td><td>Optional for creating the new collector.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceTypeCollector](ResourceTypeCollector.md)&gt;

`Success` with the new instance, or `Failure` with an error
message if the collector could not be created.
