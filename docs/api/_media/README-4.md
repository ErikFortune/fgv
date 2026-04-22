[@fgv/ts-utils](../../../README.md) &rsaquo; **logging**

# Logging

The `logging` packlet provides a simple, level-based logging framework with Result pattern integration.

## Key Exports

| Export | Description |
|--------|-------------|
| `ILogger` | Logger interface with level-based methods |
| `ConsoleLogger` | Logs to the console |
| `InMemoryLogger` | Stores log messages in arrays (useful for testing) |
| `NoOpLogger` | Silently discards all messages |
| `LogReporter<T>` | Bridges logging and the Result pattern |
| `ReporterLogLevel` | Log level type: `'all'` \| `'detail'` \| `'info'` \| `'warning'` \| `'error'` \| `'silent'` |

## Log Levels

Levels are ordered from most to least verbose:

| Level | Includes |
|-------|----------|
| `'all'` | Everything including quiet messages |
| `'detail'` | detail, info, warning, error |
| `'info'` | info, warning, error |
| `'warning'` | warning, error |
| `'error'` | error only |
| `'silent'` | Nothing |

## Usage

```typescript
import { ConsoleLogger, InMemoryLogger, NoOpLogger } from '@fgv/ts-utils';

// Console logging
const logger = new ConsoleLogger('info');
logger.info('Server started on port', port);
logger.error('Connection failed:', error.message);
logger.detail('Request details:', request); // suppressed at 'info' level

// In-memory for testing
const testLogger = new InMemoryLogger('all');
testLogger.info('test message');
expect(testLogger.logged).toContain('test message');

// Silent logger for production components that require ILogger
const silent = new NoOpLogger();
```

## LogReporter

`LogReporter` combines `ILogger` with Result-aware reporting:

```typescript
import { LogReporter } from '@fgv/ts-utils';

const reporter = new LogReporter<MyValue>({
  logger,
  valueFormatter: (value) => `Processed: ${value.name}`,
  messageFormatter: (msg) => `[ERROR] ${msg}`,
});

// Report results at specified levels
reporter.reportSuccess('info', processedValue);
reporter.reportFailure('error', 'Processing failed', detail);

// Derive a reporter with a different value formatter
const derived = reporter.withValueFormatter<OtherType>(
  (value) => `Other: ${value.id}`
);
```

---

**Packlets:** [base](../base/README.md) | [conversion](../conversion/README.md) | [validation](../validation/README.md) | [collections](../collections/README.md) | **logging** | [hash](../hash/README.md)
