[Home](../../README.md) > [Entities](../README.md) > [IProcedureStepValidation](./IProcedureStepValidation.md) > status

## IProcedureStepValidation.status property

Validation status for task reference
- 'valid': Task found and all required variables provided
- 'task-not-found': Referenced task not found in TasksLibrary
- 'missing-variables': Task found but required variables missing from params
- 'invalid-params': Params validation failed

**Signature:**

```typescript
readonly status: TaskRefStatus;
```
