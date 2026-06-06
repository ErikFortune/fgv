[Home](../README.md) > [JsonContextHelper](./JsonContextHelper.md) > extendContextRefs

## JsonContextHelper.extendContextRefs() method

Static helper to extend context references for a supplied IJsonContext | IJsonContext.

**Signature:**

```typescript
static extendContextRefs(baseContext: IJsonContext | undefined, refs?: IJsonReferenceMap[]): Result<IJsonReferenceMap | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseContext</td><td>IJsonContext | undefined</td><td>The IJsonContext | IJsonContext to be extended, or `undefined`
to start from an empty context.</td></tr>
<tr><td>refs</td><td>IJsonReferenceMap[]</td><td>Optional IJsonReferenceMap | reference maps to be added to the
IJsonContext | context.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IJsonReferenceMap](../interfaces/IJsonReferenceMap.md) | undefined&gt;

`Success` with a new IJsonReferenceMap | reference map which projects
the references from the base context, merged with and overridden by any that were passed in,
or `Failure` with a message if an error occurs.
