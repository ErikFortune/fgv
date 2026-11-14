[Home](../README.md) > [JsonEditor](./JsonEditor.md) > getDefaultRules

## JsonEditor.getDefaultRules() method

Gets the default set of rules to be applied for a given set of options.
By default, all available rules (templates, conditionals, multi-value and references)
are applied.

**Signature:**

```typescript
static getDefaultRules(options?: IJsonEditorOptions): Result<IJsonEditorRule[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IJsonEditorOptions</td><td>Optional partial IJsonEditorOptions | editor options for
all rules.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IJsonEditorRule](../interfaces/IJsonEditorRule.md)[]&gt;

Default IJsonEditorRule | editor rules with any supplied options
applied.
