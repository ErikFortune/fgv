[Home](../README.md) > optionsWithPreferred

# Function: optionsWithPreferred

Creates a converter for Model.IOptionsWithPreferred | IOptionsWithPreferred\<TOption, TId\> collections.
Validates that preferredId (if specified) exists in the options array.

## Signature

```typescript
function optionsWithPreferred(optionConverter: Converter<TOption>, idConverter: Converter<TId>, context: string): Converter<IOptionsWithPreferred<TOption, TId>>
```
