/**
 * Testbed CLI entry. Orchestration glue is c8-ignored per conventions; the testable surface
 * is the exported `runTestbedCli` function which a small `bin/testbed.js` shim invokes.
 *
 * @packageDocumentation
 */

import { scenarios as defaultScenarios } from './scenarios';
import type { IScenario } from './shell';

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

/**
 * Run the testbed CLI. At B-1 this prints a one-line status describing the registry size
 * (or a `--help` banner if the user passed `--help` / `-h`) and exits with code 0. B-3
 * (or whichever scenario first wants CLI surface) wires real scenario dispatch through
 * `--scenario <id>`.
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
  const scenarios = options.scenarios ?? defaultScenarios;
  const flags = argv.slice(2);
  if (flags.includes('--help') || flags.includes('-h')) {
    streams.stdout.write(
      'testbed CLI (B-1 scaffold)\n' +
        '  --help, -h    show this banner\n' +
        '  --scenario    (B-3+) select a scenario by id\n'
    );
    return 0;
  }

  const count = scenarios.length;
  const summary =
    count === 0
      ? 'testbed CLI — no scenarios registered yet (B-1 scaffold)\n'
      : `testbed CLI — ${count} scenario(s) registered\n`;
  streams.stdout.write(summary);
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
