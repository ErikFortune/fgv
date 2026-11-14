---
name: ts-utils-logging
description: Use when writing or reviewing any code that emits diagnostic output, observability signals, or error/failure messages in projects using the FGV toolset. The convention is to use the `logging` packlet from `@fgv/ts-utils` (`ILogger`, `BootLogger`, `LogReporter`) plus the Result-integration helpers in `@fgv/ts-utils`'s `base` packlet (`.report()`, `.orThrow(logger)`, `aggregateError(...)`) — never `console.log` / `console.error` in business logic, never construct a logger inside a component. Load this skill BEFORE adding any `console.*` call, before writing a class that wants to emit diagnostics, before writing a service-bootstrap path, or when reviewing code that throws-without-logging or constructs its own logger. Covers the boot-buffer-then-pin pattern, dependency-injection idiom, Result integration, MessageAggregator integration, and test patterns with `InMemoryLogger`.
---

# ts-utils Logging

> Source: `<repo>/.claude/skills/ts-utils-logging/SKILL.md` in the
> source corpus. Toolset binding: `@fgv/ts-utils`.

Projects using the FGV toolset use the `logging` packlet from
`@fgv/ts-utils` for all diagnostic output, paired with the
Result-integration helpers in its `base` packlet. Never `console.log`
/ `console.error` in business logic. Never construct a logger inside
a component — inject it.

The benefit is the same one you get from `Result<T>` and `FileTree`:
a uniform shape that works across boot, runtime, tests, in-process
consumers, and (eventually) durable observability backends without
business logic noticing the difference.

## Mental model

Logging in this toolset is a **two-phase substrate**:

1. **Boot phase** — a `BootLogger` buffers every log call to memory
   until durable infrastructure is up. Components created during boot
   (config readers, catalog loaders, keystore unwrap, etc.) receive
   the `BootLogger` like any other `ILogger` and have no idea they're
   talking to a buffer.
2. **Pin phase** — once the durable logger exists (`ConsoleLogger`,
   file logger, structured-output logger, whatever), call
   `bootLogger.ready(realLogger)`. The buffer flushes to the real
   logger in order, and every subsequent call forwards directly. No
   data loss, no dropped early errors, no "I'd love to log this but
   the logger isn't constructed yet."

Components downstream of boot just take an `ILogger` (or
`IResultReporter`) and don't care which phase they're in.

This is the **boot-buffer-then-pin** pattern; see
`convention.toolset.fgv.boot-buffer-then-pin` for the convention
spelled out separately.

## API surface

The convention is to import the `Logging` namespace from
`@fgv/ts-utils` and access types/classes through it:

```typescript
import { Logging, type MessageLogLevel } from '@fgv/ts-utils';

const boot = new Logging.BootLogger();
const reporter = new Logging.LogReporter<MyValue>({ logger });
const visible = Logging.shouldLog(level, threshold);
```

### `ILogger` and concrete implementations

```typescript
interface ILogger {
  readonly logLevel: ReporterLogLevel;     // 'all' | 'detail' | 'info' | 'warning' | 'error' | 'silent'
  log(level, message?, ...parameters): Success<string | undefined>;
  detail(message?, ...parameters): Success<string | undefined>;
  info(message?, ...parameters): Success<string | undefined>;
  warn(message?, ...parameters): Success<string | undefined>;
  error(message?, ...parameters): Success<string | undefined>;
}
```

`IDetailLogger` extends with `errorWithDetail(message, detail)` and
`warnWithDetail(message, detail)` — short summary at the named level,
full detail at `detail` level.

| Implementation | When |
|----------------|------|
| `Logging.ConsoleLogger(level?)` | The durable logger in node v1 |
| `Logging.InMemoryLogger(level?)` | Tests. Stores `logged` and `suppressed` arrays |
| `Logging.NoOpLogger()` | Components that require an `ILogger` but the caller doesn't care (rare; usually a smell) |
| `Logging.BootLogger(level?)` | Boot phase only. Buffers until `ready(realLogger)` is called |
| `Logging.shouldLog(level, threshold)` | Predicate — true if `level` would be emitted at `threshold` |

### `BootLogger`

```typescript
const boot = new Logging.BootLogger('detail');    // buffers everything
boot.info('starting service');                     // → buffer
const real = new Logging.ConsoleLogger('info');
boot.ready(real);                                  // flushes buffer, then forwards
boot.error('keystore unlock failed');              // → real (forwarded)
```

`isReady` reflects connection status. After `ready()`, the
`BootLogger` is essentially a thin pass-through.

### `LogReporter` — Result-pattern bridge

```typescript
const reporter = new Logging.LogReporter<MyValue>({
  logger,
  valueFormatter: (v) => `Processed: ${v.name}`,
  messageFormatter: (msg) => `[service] ${msg}`
});

reporter.reportSuccess('info', value);
reporter.reportFailure('error', 'load failed', errorDetail);

// Derive a reporter for a different value type, same logger + message formatter
const otherReporter = reporter.withValueFormatter<OtherType>((v) => `Other: ${v.id}`);
```

`LogReporter` implements **both** `IDetailLogger` and
`IResultReporter<T, TD>`, so it can be passed wherever either is
required.

### Result integration in `base`

```typescript
import type { IResultReporter } from '@fgv/ts-utils';

interface IResult<T> {
  // Report through a reporter without unwrapping; passes through unchanged.
  report(reporter?: IResultReporter<T>, options?: IResultReportOptions<unknown>): Result<T>;

  // orThrow with logger: log the error before throwing.
  orThrow(logger?: IResultLogger): T;
  orThrow(cb: ErrorFormatter): T;

  // Accumulate errors across many fallible operations without short-circuiting.
  aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter): this;
}
```

## Canonical patterns

### Boot path — module-scope logger + reporter, pinned once durable infrastructure is up

```typescript
// At module scope — created once, used by every helper in this module.
const _bootLogger = new Logging.BootLogger();
const _bootReporter = new Logging.LogReporter<unknown>({ logger: _bootLogger });

async function _buildWorkspace(): Promise<IBuildResult> {
  // Module-level helpers can log directly through the boot logger…
  _bootLogger.warn(`Ignoring invalid config namespace '${raw}'`);

  // …and downstream factories accept the reporter as a parameter named `logger`.
  const platformInit = await initializeBrowserPlatform({
    userLibraryPath: 'localStorage',
    logger: _bootReporter
  });

  if (platformInit.isFailure()) {
    _bootReporter.error(`Cloud storage could not be loaded: ${platformInit.message}`);
    return platformInit.orThrow();
  }

  // Real reporter exists once durable infrastructure is up.
  // Pin the boot logger; buffered entries flush in order, future calls forward.
  const realReporter = createDurableReporter(platformInit.value);
  _bootLogger.ready(realReporter.logger);

  return /* … */;
}
```

The two-line module preamble is the canonical shape. **Don't
construct the boot logger inside `_buildWorkspace`** — module-level
helpers need to log too, and they shouldn't take a logger parameter
for what is fundamentally module-startup diagnostics.

### Business-logic component takes a `logger`, then exposes `.logger`

```typescript
export interface IServiceCatalogCreateParams {
  config: IServiceConfig;
  keystore: IKeystore;
  logger: ILogger;
}

export class ServiceCatalog {
  public readonly logger: ILogger;

  private constructor(params: IServiceCatalogCreateParams, /* … */) {
    this.logger = params.logger;
  }

  public static fromConfig(params: IServiceCatalogCreateParams): Result<ServiceCatalog> {
    return /* … */;
  }

  public resolve(ref: ServiceRef): Result<IServiceConfig> {
    return this._lookup(ref).onFailure((err) => {
      this.logger.warn(`unknown ref: ${ref}`, { available: this._knownRefs() });
    });
  }
}
```

Two things matter here:

- **Constructor takes the logger** — never `new ConsoleLogger()`
  inside the class. Tests inject `InMemoryLogger`; boot injects the
  boot reporter; production injects the durable reporter.
- **Expose `.logger` as a public property** so callers downstream of
  this component can use `workspace.serviceCatalog.logger.error(...)`
  rather than threading the original logger through every layer.

### Result integration with `.report()`

`.report()` is for "log this outcome but don't change control flow."
The Result passes through unchanged.

```typescript
return loadConfig(path)
  .report(reporter, { success: 'detail', failure: 'error' })
  .onSuccess((cfg) => validateConfig(cfg))
  .onSuccess((cfg) => buildCatalog(cfg));
```

Use `.report()` at boundaries where you want a record of what
happened (success or failure) without disturbing the chain.

### `.orThrow()` at the boot edge — log first, then throw

Boot code that genuinely cannot recover — bad config, missing master
key — logs the failure explicitly through the boot reporter, *then*
`.orThrow()`s.

```typescript
const result = loadConfig(path);
if (result.isFailure()) {
  _bootReporter.error(`Config load failed: ${result.message}`);
  return result.orThrow();
}
```

`.orThrow(logger)` (the overload that takes a logger and logs
internally) is also fine. Pick one and be consistent within a module.

**Never `.orThrow()` without having logged the failure** — a thrown
bootstrap error with no diagnostic is the "process died with no clue
why" pattern.

### `aggregateError` for multi-step validation

```typescript
import { MessageAggregator, mapResults } from '@fgv/ts-utils';

const errors = new MessageAggregator();
const validated = entries
  .map((e) => validateEntry(e).aggregateError(errors, (msg) => `entry ${e.id}: ${msg}`));

if (errors.hasMessages) {
  errors.messages.forEach((m) => logger.warn(m));
  return fail(`catalog has ${errors.messages.length} bad entries`);
}
return mapResults(validated);
```

### Filtering by level — `Logging.shouldLog`

```typescript
const filteredToasts = toasts.filter((msg) =>
  Logging.shouldLog(msg.level, toastLevel)
);
```

### Tests

```typescript
import { Logging } from '@fgv/ts-utils';

describe('ServiceCatalog', () => {
  let logger: Logging.InMemoryLogger;
  let catalog: ServiceCatalog;

  beforeEach(() => {
    logger = new Logging.InMemoryLogger('all');
    catalog = ServiceCatalog.fromConfig({ config, keystore, logger }).orThrow();
  });

  test('warns on unknown ref', () => {
    expect(catalog.resolve(unknownRef)).toFailWith(/unknown ref/);
    expect(logger.logged.some((m) => m.includes('unknown ref'))).toBe(true);
  });
});
```

For tests that don't care about logs, inject `new Logging.NoOpLogger()`
rather than skipping the parameter.

## Anti-patterns

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| `console.log(...)` / `console.error(...)` in business logic | No level control, no test capture, no boot buffer, no Result integration | Inject an `ILogger`; call `logger.info/warn/error`. |
| `private _logger = new Logging.ConsoleLogger('info')` inside a class | Untestable, fixes log level at class scope, ignores boot phase | Take `logger` as a constructor / factory parameter. |
| `result.orThrow()` with no preceding log at the boot edge | Process exits with no diagnostic | Log explicitly, *then* `.orThrow()`. |
| `result.orThrow()` in business logic | Throws in fallible code; violates the Result-pattern rule | Return `Result<T>`. |
| `try { … } catch (e) { logger.error(e); throw e; }` around Result-returning code | Re-introduces exceptions | `result.report(reporter, { failure: 'error' }).onFailure(...)`. |
| Logging the same failure at every layer of a chain | Duplicate noise, hard to trace | Log once at the layer with most context. |
| `if (X.isFailure()) { logger.error(X.message); return X; }` | Imperative propagation the Result chain handles cleanly | `X.onFailure((m) => logger.error(m))` or `X.report(reporter, { failure: 'error' })`. |
| Boot logger constructed inside the bootstrap function | Module-level helpers can't log without a parameter | Module-scope `const _bootLogger = new Logging.BootLogger();`. |
| Component takes `logger` but doesn't expose `.logger` | Callers thread the original logger past the component | `public readonly logger: ILogger` — set in constructor. |
| Tests that swallow logs | Lose the ability to verify diagnostic behavior | Inject `Logging.InMemoryLogger`; assert on `.logged`. |

## When to load this skill

- Writing a new component / class / factory that emits any diagnostic
  output.
- Writing a service-bootstrap or boot-time path.
- Reviewing code that calls `console.*`, constructs
  `new ConsoleLogger(...)` mid-component, or has bare `.orThrow()` at
  a boot edge.
- Adding observability to existing code.
- Writing a test that needs to assert on diagnostic behavior.

## Where this couples to other skills

- **`result-pattern`** — `.report()`, `.orThrow(logger)`, and
  `aggregateError` are Result-pattern integrations.
- **`result-tests`** — `InMemoryLogger` + `toSucceedAndSatisfy` is
  the canonical pattern for asserting "the operation succeeded AND
  emitted the right warning."
