[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > build

## ResourceManagerBuilder.build() method

Builds the Resources.Resource | resources from the collected Resources.ResourceCandidate | candidates.

**Signature:**

```typescript
build(): Result<ResourceManagerBuilder>;
```

**Returns:**

Result&lt;[ResourceManagerBuilder](ResourceManagerBuilder.md)&gt;

`Success` with the Resources.ResourceManagerBuilder | ResourceManagerBuilder object if successful,
or `Failure` with an error message if not.
