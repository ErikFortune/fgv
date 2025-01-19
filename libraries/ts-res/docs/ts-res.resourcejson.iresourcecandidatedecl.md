<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [ResourceJson](./ts-res.resourcejson.md) &gt; [IResourceCandidateDecl](./ts-res.resourcejson.iresourcecandidatedecl.md)

## ResourceJson.IResourceCandidateDecl interface

Interface representing a resource candidate declaration.

**Signature:**

```typescript
export interface IResourceCandidateDecl 
```

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
<tbody><tr><td>

[conditions](./ts-res.resourcejson.iresourcecandidatedecl.conditions.md)


</td><td>

`readonly`


</td><td>

[ConditionSetDecl](./ts-res.resourcejson.conditionsetdecl.md)


</td><td>

The conditions that must be met for the resource to be selected.


</td></tr>
<tr><td>

[id](./ts-res.resourcejson.iresourcecandidatedecl.id.md)


</td><td>

`readonly`


</td><td>

[ResourceId](./ts-res.resourceid.md)


</td><td>

The [id](./ts-res.resourceid.md) of the resource.


</td></tr>
<tr><td>

[isPartial?](./ts-res.resourcejson.iresourcecandidatedecl.ispartial.md)


</td><td>

`readonly`


</td><td>

boolean


</td><td>

_(Optional)_ If true, the resource is only a partial representation of the full resource.


</td></tr>
<tr><td>

[json](./ts-res.resourcejson.iresourcecandidatedecl.json.md)


</td><td>

`readonly`


</td><td>

JsonValue


</td><td>

The JSON value of the resource.


</td></tr>
<tr><td>

[mergeMethod?](./ts-res.resourcejson.iresourcecandidatedecl.mergemethod.md)


</td><td>

`readonly`


</td><td>

[ResourceValueMergeMethod](./ts-res.resourcevaluemergemethod.md)


</td><td>

_(Optional)_ The merge method to be used when merging the resource into the existing resource. default is 'augment'.


</td></tr>
<tr><td>

[resourceTypeName?](./ts-res.resourcejson.iresourcecandidatedecl.resourcetypename.md)


</td><td>

`readonly`


</td><td>

[ResourceTypeName](./ts-res.resourcetypename.md)


</td><td>

_(Optional)_ The type of resource.


</td></tr>
</tbody></table>