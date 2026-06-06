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

import { Result, succeed } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';
import { ITutorialPrinter } from '../utils';
import { runLesson1 } from './lesson01LoadConfig';
import { runLesson2 } from './lesson02Import';
import { runLesson3 } from './lesson03Runtime';
import { runLesson4 } from './lesson04Resolve';
import { runLesson5 } from './lesson05Inference';

export * from './lesson01LoadConfig';
export * from './lesson02Import';
export * from './lesson03Runtime';
export * from './lesson04Resolve';
export * from './lesson05Inference';

/**
 * Runs every lesson in order, feeding each lesson the output of the
 * previous one.
 *
 * @remarks
 * This is the function invoked by both the `all` CLI subcommand and the
 * lesson smoke tests. Every lesson returns a `Result` - any failure
 * short-circuits the chain so the test harness gets a precise error.
 *
 * Lesson 5 is independent of Lessons 2-4: it imports a separate
 * `data/inferred/` tree into its own resource manager because the
 * inference demo is orthogonal to the resource graph the earlier
 * lessons built. It still reuses the Lesson 1 system configuration so
 * the qualifier tokens and `tokenIsOptional` flags are consistent.
 *
 * @param printer - Sink for tutorial output.
 * @returns `Success` when every lesson finished cleanly.
 * @public
 */
export function runAllLessons(printer: ITutorialPrinter): Result<undefined> {
  return runLesson1(printer)
    .onSuccess((systemConfig: Config.SystemConfiguration) =>
      runLesson2(printer, systemConfig)
        .onSuccess((resourceManager) =>
          runLesson3(printer, systemConfig, resourceManager).onSuccess((resolver) =>
            runLesson4(printer, resolver)
          )
        )
        .onSuccess(() => runLesson5(printer, systemConfig))
    )
    .onSuccess(() => succeed(undefined));
}
