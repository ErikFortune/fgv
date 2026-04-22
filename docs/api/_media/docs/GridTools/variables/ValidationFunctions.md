[Home](../../README.md) > [GridTools](../README.md) > ValidationFunctions

# Variable: ValidationFunctions

Common validation functions for reuse.

## Type

`{ validJson: (value: JsonValue) => string | null; numberRange: (min: number, max: number) => (value: JsonValue) => string | null; oneOf: (allowedValues: JsonValue[]) => (value: JsonValue) => string | null; excludeCharacters: (forbiddenChars: string) => (value: JsonValue) => string | null }`
