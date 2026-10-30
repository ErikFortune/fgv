/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { spawnSync } from 'child_process';
import { captureResult } from '@fgv/ts-utils';

/**
 * What a script run in its own process reported.
 */
export interface IIsolatedRun {
  /** True if the process was killed for exceeding its time limit. */
  readonly timedOut: boolean;
  /** The last line the script wrote to stdout, parsed as JSON, or `undefined`. */
  readonly report: unknown;
  /** Everything the process wrote to stderr. */
  readonly stderr: string;
}

/**
 * Runs `script` in a child Node process with a hard time limit, so a case that hangs (a synchronous
 * exponential walk cannot be interrupted by a Jest timeout) fails its test rather than wedging the
 * suite. The script sees `lib`, the package's compiled entry point, and reports by writing one JSON
 * line to stdout.
 * @param entryPoint - Absolute path of the module to expose as `lib`.
 * @param script - The script body.
 * @param timeoutMs - The hard limit.
 */
export function runIsolated(entryPoint: string, script: string, timeoutMs: number): IIsolatedRun {
  const program = `const lib = require(${JSON.stringify(entryPoint)});\n${script}`;
  const run = spawnSync(process.execPath, ['-e', program], {
    encoding: 'utf-8',
    timeout: timeoutMs,
    killSignal: 'SIGKILL'
  });
  const lines = run.stdout.trim().split('\n');
  const report: unknown = captureResult((): unknown => JSON.parse(lines[lines.length - 1])).orDefault(
    undefined
  );
  return { timedOut: run.signal === 'SIGKILL', report, stderr: run.stderr };
}
