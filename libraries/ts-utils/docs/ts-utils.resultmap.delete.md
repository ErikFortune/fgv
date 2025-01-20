<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [ResultMap](./ts-utils.resultmap.md) &gt; [delete](./ts-utils.resultmap.delete.md)

## ResultMap.delete() method

Deletes a key from the map.

**Signature:**

```typescript
delete(key: TK): DetailedResult<TV, ResultMapResultDetail>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

key


</td><td>

TK


</td><td>

The key to delete.


</td></tr>
</tbody></table>
**Returns:**

[DetailedResult](./ts-utils.detailedresult.md)<!-- -->&lt;TV, [ResultMapResultDetail](./ts-utils.collections.resultmapresultdetail.md)<!-- -->&gt;

`Success` with the previous value and the detail 'deleted' if the key was found and deleted, `Failure` with detail 'not-found' if the key was not found, or with detail 'invalid-key' if the key is invalid.
