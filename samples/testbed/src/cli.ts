/**
 * Testbed CLI entry. Orchestration glue is c8-ignored per conventions; the testable surface
 * is the exported `runTestbedCli` function which a small `bin/testbed.js` shim invokes.
 *
 * @packageDocumentation
 */

import { Logging, type MessageLogLevel, type Success, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { dataFiles } from './generated/dataFileTree';
import { scenarios as defaultScenarios } from './scenarios';
import { resolveSecret } from './shell';
import type { IScenario, IScenarioContext } from './shell';

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
        /* c8 ignore next 1 - getEnvVar is not called by the B-1 resolveSecret stub; real env-var lookup lands when the stub is replaced */
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Run the testbed CLI. Supports `--scenario <id>` to dispatch a named scenario's
 * `cli.run()`, `--help` / `-h` for usage, and bare invocation to list available
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
        '  --scenario <id>         run a named scenario\n\n' +
        'Available scenarios:\n' +
        `${formatScenarioList(allScenarios)}\n`
    );
    return 0;
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

    const context = buildCliContext(streams);
    const result = await scenario.cli.run(context);
    if (result.isFailure()) {
      streams.stderr.write(`testbed CLI: scenario "${scenarioId}" failed: ${result.message}\n`);
      return 1;
    }

    streams.stdout.write(`${result.value}\n`);
    return 0;
  }

  // Bare invocation — list available scenarios.
  const count = allScenarios.length;
  if (count === 0) {
    streams.stdout.write('testbed CLI — no scenarios registered yet.\n');
  } else {
    streams.stdout.write(
      `testbed CLI — ${count} scenario(s) available:\n${formatScenarioList(allScenarios)}\n` +
        '\nRun with --scenario <id> to execute a scenario.\n'
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
