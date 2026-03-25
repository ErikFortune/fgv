[Home](../../README.md) > [ResourceTypes](../README.md) > [IResourceType](./IResourceType.md) > createTemplate

## IResourceType.createTemplate() method

Creates a template for a new resource of this type.
The template provides a default structure for creating new resource instances.

**Signature:**

```typescript
createTemplate(resourceId: ResourceId, init?: JsonValue, conditions?: ConditionSetDecl, resolver?: IResourceResolver): Result<ILooseResourceDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resourceId</td><td>ResourceId</td><td>The id for the new resource.</td></tr>
<tr><td>init</td><td>JsonValue</td><td>An optional initial value for the resource.</td></tr>
<tr><td>conditions</td><td>ConditionSetDecl</td><td>An optional set of conditions that must be met for the resource to be selected.</td></tr>
<tr><td>resolver</td><td>IResourceResolver</td><td>An optional resource resolver that can be used to create the template.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ILooseResourceDecl](../../interfaces/ILooseResourceDecl.md)&gt;

A loose resource declaration with default values for this resource type.
