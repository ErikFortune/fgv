[Home](../../../README.md) > [Runtime](../../README.md) > [ResourceTree](../README.md) > [ResourceTreeChildrenValidator](./ResourceTreeChildrenValidator.md) > get

## ResourceTreeChildrenValidator.get() method

Gets a child node by its string key with detailed error information.

**Signature:**

```typescript
get(key: string): DetailedResult<IReadOnlyResourceTreeNode<T>, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The string key to look up</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[IReadOnlyResourceTreeNode](../../../type-aliases/IReadOnlyResourceTreeNode.md)&lt;T&gt;, ResultMapResultDetail&gt;

DetailedResult containing the node if found, or failure with details
