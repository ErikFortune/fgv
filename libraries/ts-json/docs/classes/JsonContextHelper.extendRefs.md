[Home](../README.md) > [JsonContextHelper](./JsonContextHelper.md) > extendRefs

## JsonContextHelper.extendRefs() method

Applies JsonContextHelper.extendContextRefs | extendContextRefs to the
IJsonContext | IJsonContext associated with this helper.

**Signature:**

```typescript
extendRefs(refs?: IJsonReferenceMap[]): Result<IJsonReferenceMap | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>refs</td><td>IJsonReferenceMap[]</td><td>Optional IJsonReferenceMap | reference maps to be added to the</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IJsonReferenceMap](../interfaces/IJsonReferenceMap.md) | undefined&gt;

`Success` with a new IJsonReferenceMap | reference map which projects
the references from the base context, merged with and overridden by any that were passed in,
or `Failure` with a message if an error occurs.
