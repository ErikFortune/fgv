[Home](../../../README.md) > [Validation](../../README.md) > [Classes](../README.md) > [ObjectValidator](./ObjectValidator.md) > addPartial

## ObjectValidator.addPartial() method

Creates a new Validation.Classes.ObjectValidator | ObjectValidator derived from this one but with
new optional properties as specified by a supplied array of `keyof T`.

**Signature:**

```typescript
addPartial(addOptionalFields: (keyof T)[]): ObjectValidator<Partial<T>, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>addOptionalFields</td><td>(keyof T)[]</td><td>The keys to be made optional.</td></tr>
</tbody></table>

**Returns:**

[ObjectValidator](../../../classes/ObjectValidator.md)&lt;Partial&lt;T&gt;, TC&gt;

A new Validation.Classes.ObjectValidator | ObjectValidator with the additional optional
source properties.
