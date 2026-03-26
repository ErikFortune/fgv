[Home](../../README.md) > [Mustache](../README.md) > [MustacheTemplate](./MustacheTemplate.md) > create

## MustacheTemplate.create() method

Creates a new MustacheTemplate instance.

**Signature:**

```typescript
static create(template: string, options?: IMustacheTemplateOptions): Result<MustacheTemplate>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>template</td><td>string</td><td>The Mustache template string to parse</td></tr>
<tr><td>options</td><td>IMustacheTemplateOptions</td><td>Optional parsing options</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MustacheTemplate](../../classes/MustacheTemplate.md)&gt;

Success with the template instance, or Failure if parsing fails
