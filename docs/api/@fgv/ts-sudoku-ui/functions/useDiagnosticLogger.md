[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / useDiagnosticLogger

# Function: useDiagnosticLogger()

> **useDiagnosticLogger**(): [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Hook to access the current diagnostic logger.

Provides access to diagnostic logging for development and debugging.

## Returns

[`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

The current diagnostic logger

## Example

```tsx
function CageOverlay({ cages }: ICageOverlayProps) {
  const log = useDiagnosticLogger();

  useEffect(() => {
    log.info('CageOverlay rendered', {
      cageCount: cages.length,
      cages: cages.map((c) => ({ id: c.cage.id, cellIds: c.cage.cellIds }))
    });
  }, [cages, log]);

  return <div>...</div>;
}
```
