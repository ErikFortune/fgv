[Home](../../README.md) > [Validators](../README.md) > isA

# Function: isA

Helper function to create a Validation.Classes.TypeGuardValidator | TypeGuardValidator which
validates a value or object in place.

## Signature

```typescript
function isA(description: string, guard: TypeGuardWithContext<T, TC>, params: Omit<TypeGuardValidatorConstructorParams<T, TC>, "description" | "guard">): TypeGuardValidator<T, TC>
```
