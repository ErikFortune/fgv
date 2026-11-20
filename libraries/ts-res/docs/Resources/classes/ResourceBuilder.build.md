[Home](../../README.md) > [Resources](../README.md) > [ResourceBuilder](./ResourceBuilder.md) > build

## ResourceBuilder.build() method

Builds the Resources.Resource | resource object from this builder.

**Signature:**

```typescript
build(): Result<Resource>;
```

**Returns:**

Result&lt;[Resource](../../classes/Resource.md)&gt;

`Success` with the new Resources.Resource | Resource object if successful,
or `Failure` with an error message if not. Fails if no candidates have been added
or if the resource type is not defined.
