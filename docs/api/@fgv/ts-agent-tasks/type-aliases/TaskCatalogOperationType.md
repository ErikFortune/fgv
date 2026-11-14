[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskCatalogOperationType

# Type Alias: TaskCatalogOperationType

> **TaskCatalogOperationType** = `"create-tracked"` \| `"create-list"` \| `"register-external"` \| `"update-tracked"` \| `"reassign"` \| `"change-scopes"` \| `"reparent"` \| `"stop"` \| `"release-stop"` \| `"archive"` \| `"complete-list"`

The catalog (non-command) operations a task record can hold evidence for.

## Remarks

Metadata changes and creation are their own discriminated variants, never fake execution
commands (design §8.3). T3 declares the closed set so records written today can carry any
of them; the typed request and receipt shapes of each belong to the slices that implement
the operation, so both are stored as validated JSON here.
