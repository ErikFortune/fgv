/*
 * Copyright (c) 2025 Erik Fortune
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

import { Command } from 'commander';
import { Result } from '@fgv/ts-utils';
import { Runtime } from '@fgv/ts-res';
import { runAllLessons, runLesson1, runLesson2, runLesson3, runLesson4 } from './lessons';
import { ConsoleTutorialPrinter, ITutorialPrinter } from './utils';

/**
 * Minimal CLI wrapper around the tutorial lessons. Each subcommand
 * invokes one lesson (or all four in order).
 *
 * @remarks
 * The CLI is intentionally thin - every lesson is a plain function that
 * takes an {@link ITutorialPrinter} so it can be exercised from tests
 * without going through commander at all. Keep the CLI layer "dumb" so
 * the interesting code lives in the lessons where readers expect it.
 *
 * @public
 */
export class TutorialApp {
  private readonly _printer: ITutorialPrinter;

  /**
   * Creates a new tutorial CLI.
   *
   * @param printer - Optional printer override. Defaults to a
   *                  `ConsoleTutorialPrinter` that writes to stdout.
   */
  public constructor(printer?: ITutorialPrinter) {
    this._printer = printer ?? new ConsoleTutorialPrinter();
  }

  /**
   * Parses `argv` and runs the requested subcommand. Mirrors the signature
   * of `commander`'s `program.parseAsync` so the bin script can simply
   * pass through `process.argv`.
   */
  public async run(argv: string[]): Promise<void> {
    const program = new Command();
    program.name('ts-res-tutorial').description('Hands-on tutorial for the @fgv/ts-res library');

    program
      .command('lesson1-config')
      .description('Lesson 1 - load a qualifier configuration')
      .action(() => {
        runLesson1(this._printer).orThrow();
      });

    program
      .command('lesson2-import')
      .description('Lesson 2 - import YAML resources via the preprocessor')
      .action(() => {
        runLesson1(this._printer)
          .onSuccess((systemConfig) => runLesson2(this._printer, systemConfig))
          .orThrow();
      });

    program
      .command('lesson3-runtime')
      .description('Lesson 3 - wire the runtime (context provider + resolver)')
      .action(() => {
        this._runThroughLesson3().orThrow();
      });

    program
      .command('lesson4-resolve')
      .description('Lesson 4 - resolve resources (best, all, composed, manual)')
      .action(() => {
        this._runThroughLesson3()
          .onSuccess((resolver) => runLesson4(this._printer, resolver))
          .orThrow();
      });

    program
      .command('all')
      .description('Run every lesson in order')
      .action(() => {
        runAllLessons(this._printer).orThrow();
      });

    await program.parseAsync(argv);
  }

  /**
   * Helper that chains lessons 1-3 so lesson 4 can run against the
   * resulting resolver.
   */
  private _runThroughLesson3(): Result<Runtime.ResourceResolver> {
    return runLesson1(this._printer).onSuccess((systemConfig) =>
      runLesson2(this._printer, systemConfig).onSuccess((resourceManager) =>
        runLesson3(this._printer, systemConfig, resourceManager)
      )
    );
  }
}
