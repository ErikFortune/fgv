<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json-base](./ts-json-base.md) &gt; [Validators](./ts-json-base.validators.md) &gt; [jsonValue](./ts-json-base.validators.jsonvalue.md)

## Validators.jsonValue variable

An in-place validator which validates that a supplied `unknown` value is a valid [JsonValue](./ts-json-base.jsonvalue.md)<!-- -->. Fails by default if any properties or array elements are `undefined` - this default behavior can be overridden by supplying an appropriate [context](./ts-json-base.validators.ijsonvalidatorcontext.md) at runtime.

**Signature:**

```typescript
jsonValue: Validator<JsonValue, IJsonValidatorContext>
```
