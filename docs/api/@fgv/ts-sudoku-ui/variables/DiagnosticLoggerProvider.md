[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / DiagnosticLoggerProvider

# Variable: DiagnosticLoggerProvider

> `const` **DiagnosticLoggerProvider**: `React.FC`\<[`IDiagnosticLoggerProviderProps`](../interfaces/IDiagnosticLoggerProviderProps.md)\>

Provider component that makes diagnostic logger available to all child components.

## Example

```tsx
// Basic usage with default no-op logger
<DiagnosticLoggerProvider>
  <SudokuGrid />
</DiagnosticLoggerProvider>

// Console logging for development
const consoleLogger = new Logging.LogReporter({
  logger: new Logging.ConsoleLogger('info')
});
<DiagnosticLoggerProvider logger={consoleLogger}>
  <SudokuGrid />
</DiagnosticLoggerProvider>

// In-memory logger for tests
const testLogger = new Logging.LogReporter({
  logger: new Logging.InMemoryLogger('detail')
});
<DiagnosticLoggerProvider logger={testLogger}>
  <SudokuGrid />
</DiagnosticLoggerProvider>
```

## Param

Provider configuration

## Returns

JSX provider element
