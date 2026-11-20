/**
 * Testbed CLI entry. Orchestration glue is c8-ignored per conventions; the testable surface
 * is the exported `runTestbedCli` function which a small `bin/testbed.js` shim invokes.
 *
 * @packageDocumentation
 */

import {
  Logging,
  type MessageLogLevel,
  type Result,
  type Success,
  captureAsyncResult,
  fail,
  succeed
} from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { dataFiles } from './generated/dataFileTree';
import { scenarios as defaultScenarios } from './scenarios';
import { resolveSecret } from './shell';
import type { ICliScenarioImpl, IScenario, IScenarioContext } from './shell';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Streams the CLI uses for output. Injectable so tests can capture without piping stdout.
 * @public
 */
export interface ITestbedCliStreams {
  readonly stdout: { write(chunk: string): unknown };
  readonly stderr: { write(chunk: string): unknown };
}

/**
 * Options for {@link runTestbedCli}. The default scenario registry is the production list;
 * tests override to exercise both empty and populated paths.
 * @public
 */
export interface ITestbedCliOptions {
  readonly scenarios?: readonly IScenario[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A {@link Logging.LoggerBase} subclass that writes all logged messages to a given
 * writable stream (intended for stderr). Used by {@link buildCliContext} so that
 * scenario diagnostic output goes to `streams.stderr` rather than the Node console,
 * keeping `streams.stdout` clean for the structured summary `runTestbedCli` prints.
 */
class StreamLogger extends Logging.LoggerBase {
  private readonly _stream: { write(chunk: string): unknown };

  public constructor(stream: { write(chunk: string): unknown }, level: Logging.ReporterLogLevel = 'info') {
    super(level);
    this._stream = stream;
  }

  protected _log(message: string, __level: MessageLogLevel): Success<string | undefined> {
    this._stream.write(message + '\n');
    return succeed(message);
  }
}

/**
 * Build an `IScenarioContext` for the CLI. The logger writes to `streams.stderr` via a
 * {@link StreamLogger} subclass of {@link Logging.LoggerBase}, which delegates `_log`
 * calls to the injected stderr stream, keeping stdout clean for the structured summary.
 * keyStore is undefined (secret resolution is env-var-only on the CLI).
 */
function buildCliContext(streams: ITestbedCliStreams): IScenarioContext {
  const logger = new Logging.LogReporter<unknown>({ logger: new StreamLogger(streams.stderr) });

  // orThrow() is intentional — builds from a statically-known list; failure means a broken build artifact.
  const dataTree: FileTree.FileTree = FileTree.inMemory([...dataFiles]).orThrow();

  return {
    logger,
    keyStore: undefined,
    resolveSecret: (spec) =>
      resolveSecret({
        spec,
        keyStore: undefined,
        getEnvVar: (name) => process.env[name]
      }),
    dataTree
  };
}

/**
 * Format the scenario list as a human-readable string for `--help` and list output.
 */
function formatScenarioList(allScenarios: readonly IScenario[]): string {
  if (allScenarios.length === 0) {
    return '  (no scenarios registered)\n';
  }
  return allScenarios
    .map((s) => {
      const surfaces: string[] = [];
      if (s.web) {
        surfaces.push('web');
      }
      if (s.cli) {
        surfaces.push('cli');
      }
      const surfaceStr = surfaces.length > 0 ? ` [${surfaces.join(', ')}]` : '';
      return `  ${s.id}${surfaceStr} — ${s.title}`;
    })
    .join('\n');
}

/** What one scenario's CLI surface did: ran (with its report), or declined to, and why. */
type ScenarioCliOutcome =
  | { readonly kind: 'ran'; readonly report: string }
  | { readonly kind: 'skipped'; readonly reason: string };

/**
 * Run one scenario's CLI surface: its `skipReason` precondition first, then `run` if that holds.
 * A thrown error or a rejected promise from either becomes a `Failure`, so a caller looping over
 * many scenarios is never aborted by one of them.
 */
async function runScenarioCli(
  cli: ICliScenarioImpl,
  streams: ITestbedCliStreams
): Promise<Result<ScenarioCliOutcome>> {
  const context = buildCliContext(streams);
  return (
    await captureAsyncResult(async (): Promise<Result<ScenarioCliOutcome>> => {
      const reason = await cli.skipReason?.(context);
      if (reason !== undefined) {
        return succeed({ kind: 'skipped', reason });
      }
      return (await cli.run(context)).onSuccess((report) => succeed({ kind: 'ran', report }));
    })
  ).onSuccess((outcome) => outcome);
}

/** One scenario's outcome in an `--all` run. */
type AllRunOutcome =
  | { readonly id: string; readonly kind: 'passed' }
  | { readonly id: string; readonly kind: 'failed'; readonly message: string }
  | { readonly id: string; readonly kind: 'skipped'; readonly reason: string };

/**
 * Parse `--skip <id>[,<id>...]`. Returns the ids to skip (empty when the flag is absent), or a
 * `Failure` when the flag has no value or names a scenario that is not registered — a typo would
 * otherwise silently run the scenario it meant to skip.
 */
function parseSkipIds(
  flags: readonly string[],
  allScenarios: readonly IScenario[]
): Result<ReadonlySet<string>> {
  const index = flags.indexOf('--skip');
  if (index === -1) {
    return succeed(new Set<string>());
  }
  const value = flags[index + 1];
  if (value === undefined || value.startsWith('-')) {
    return fail('--skip requires a comma-separated list of scenario ids');
  }
  const ids = value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  const unknown = ids.filter((id) => !allScenarios.some((s) => s.id === id));
  if (unknown.length > 0) {
    return fail(`--skip names unknown scenario(s): ${unknown.join(', ')}`);
  }
  return succeed(new Set(ids));
}

/** Indent continuation lines so a multi-line failure message stays under its id in the summary. */
function indentContinuation(message: string): string {
  return message.replace(/\n/g, '\n      ');
}

/**
 * Run every scenario with a CLI surface, sequentially in registration order, and print a summary.
 * One scenario's failure — including a throw or a rejection — is recorded, never fatal to the run.
 * @returns `1` if any scenario failed, otherwise `0`.
 */
async function runAllScenarios(
  allScenarios: readonly IScenario[],
  skipIds: ReadonlySet<string>,
  streams: ITestbedCliStreams
): Promise<number> {
  const outcomes: AllRunOutcome[] = [];
  for (const scenario of allScenarios) {
    if (skipIds.has(scenario.id)) {
      outcomes.push({ id: scenario.id, kind: 'skipped', reason: '--skip' });
      continue;
    }
    if (!scenario.cli) {
      outcomes.push({ id: scenario.id, kind: 'skipped', reason: 'web-only' });
      continue;
    }
    streams.stdout.write(`=== ${scenario.id}\n`);
    const result = await runScenarioCli(scenario.cli, streams);
    if (result.isSuccess() && result.value.kind === 'skipped') {
      streams.stdout.write(`skipped — ${result.value.reason}\n`);
      outcomes.push({ id: scenario.id, kind: 'skipped', reason: result.value.reason });
    } else if (result.isSuccess()) {
      streams.stdout.write(`${result.value.report}\n`);
      outcomes.push({ id: scenario.id, kind: 'passed' });
    } else {
      streams.stdout.write(`FAILED: ${result.message}\n`);
      outcomes.push({ id: scenario.id, kind: 'failed', message: result.message });
    }
  }

  const failed = outcomes.filter((o): o is Extract<AllRunOutcome, { kind: 'failed' }> => o.kind === 'failed');
  const skipped = outcomes.filter(
    (o): o is Extract<AllRunOutcome, { kind: 'skipped' }> => o.kind === 'skipped'
  );
  const passed = outcomes.length - failed.length - skipped.length;
  const lines: string[] = [
    '=== testbed --all summary',
    `passed ${passed} · failed ${failed.length} · skipped ${skipped.length}`,
    ...(failed.length > 0
      ? ['failed:', ...failed.map((o) => `  ${o.id}: ${indentContinuation(o.message)}`)]
      : []),
    ...(skipped.length > 0 ? ['skipped:', ...skipped.map((o) => `  ${o.id} (${o.reason})`)] : [])
  ];
  streams.stdout.write(`${lines.join('\n')}\n`);
  return failed.length > 0 ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Run the testbed CLI. Supports `--scenario <id>` to dispatch a named scenario's
 * `cli.run()`, `--all` (optionally with `--skip <id>[,<id>...]`) to run every scenario with a
 * CLI surface and summarize, `--help` / `-h` for usage, and bare invocation to list available
 * scenarios.
 *
 * @param argv - Raw `process.argv` (or test-supplied equivalent).
 * @param streams - Output streams (stdout/stderr).
 * @param options - Optional overrides, primarily for tests.
 * @returns A non-negative exit code: `0` on success, non-zero on failure.
 * @public
 */
export async function runTestbedCli(
  argv: readonly string[],
  streams: ITestbedCliStreams,
  options: ITestbedCliOptions = {}
): Promise<number> {
  const allScenarios = options.scenarios ?? defaultScenarios;
  const flags = argv.slice(2);

  // --help / -h
  if (flags.includes('--help') || flags.includes('-h')) {
    streams.stdout.write(
      'testbed CLI\n' +
        '  --help, -h              show this banner\n' +
        '  --scenario <id>         run a named scenario\n' +
        '  --all                   run every scenario with a CLI surface, then print a summary;\n' +
        '                          exits 1 if any failed (web-only scenarios are skipped)\n' +
        '  --skip <id>[,<id>...]   with --all, leave these scenarios out\n\n' +
        'Available scenarios:\n' +
        `${formatScenarioList(allScenarios)}\n`
    );
    return 0;
  }

  // --all [--skip <ids>]
  if (flags.includes('--all')) {
    if (flags.includes('--scenario')) {
      streams.stderr.write('testbed CLI: --all and --scenario cannot be combined\n');
      return 1;
    }
    const skipIds = parseSkipIds(flags, allScenarios);
    if (skipIds.isFailure()) {
      streams.stderr.write(`testbed CLI: ${skipIds.message}\n`);
      return 1;
    }
    return runAllScenarios(allScenarios, skipIds.value, streams);
  }

  // --scenario <id>
  const scenarioFlagIndex = flags.indexOf('--scenario');
  if (scenarioFlagIndex !== -1) {
    const scenarioId = flags[scenarioFlagIndex + 1];
    if (scenarioId === undefined || scenarioId.startsWith('-')) {
      streams.stderr.write('testbed CLI: --scenario requires an id argument\n');
      return 1;
    }

    const scenario = allScenarios.find((s) => s.id === scenarioId);
    if (scenario === undefined) {
      streams.stderr.write(
        `testbed CLI: unknown scenario "${scenarioId}"\n` +
          `Available:\n${formatScenarioList(allScenarios)}\n`
      );
      return 1;
    }

    if (!scenario.cli) {
      streams.stderr.write(`testbed CLI: scenario "${scenarioId}" has no CLI implementation (web-only)\n`);
      return 1;
    }

    const result = await runScenarioCli(scenario.cli, streams);
    if (result.isFailure()) {
      streams.stderr.write(`testbed CLI: scenario "${scenarioId}" failed: ${result.message}\n`);
      return 1;
    }

    streams.stdout.write(
      result.value.kind === 'skipped'
        ? `testbed CLI: scenario "${scenarioId}" skipped — ${result.value.reason}\n`
        : `${result.value.report}\n`
    );
    return 0;
  }

  // Bare invocation — list available scenarios.
  const count = allScenarios.length;
  if (count === 0) {
    streams.stdout.write('testbed CLI — no scenarios registered yet.\n');
  } else {
    streams.stdout.write(
      `testbed CLI — ${count} scenario(s) available:\n${formatScenarioList(allScenarios)}\n` +
        '\nRun with --scenario <id> to execute a scenario, or --all to run every one.\n'
    );
  }
  return 0;
}

/* c8 ignore start - entry-point orchestration glue per testbed conventions */
if (require.main === module) {
  runTestbedCli(process.argv, { stdout: process.stdout, stderr: process.stderr })
    .then((code) => process.exit(code))
    .catch((err: unknown) => {
      process.stderr.write(`testbed CLI: unhandled error: ${String(err)}\n`);
      process.exit(1);
    });
}
/* c8 ignore stop */
