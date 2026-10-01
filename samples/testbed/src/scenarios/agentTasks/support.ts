/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The journey's small helpers over `@fgv/ts-agent-tasks` results and tool answers.
 *
 * @remarks
 * A helper that **halts** the journey (`resolvedInspection`, `requireApplied`, `oneNewKey`) is for
 * a call the design says cannot go otherwise there; it throws, and the journey's top level turns the
 * throw into a `Failure`. A helper that **observes** (`codeOf`, `refusalOf`, `answerOf`,
 * `resolutionsFor`) returns what happened, so a step can record it as a check.
 *
 * @packageDocumentation
 */

import { AiAssist } from '@fgv/ts-extras';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { ICommandResolution, TaskInspection, TaskResult } from '@fgv/ts-agent-tasks';

/** A resolved inspection. */
export type ResolvedInspection = Extract<TaskInspection, { state: 'resolved' }>;

/** An inspection the journey expects to be resolved; halts otherwise. */
export function resolvedInspection(id: string, found: TaskInspection): ResolvedInspection {
  return (
    found.state === 'resolved' ? succeed(found) : fail<ResolvedInspection>(`${id} is unresolved`)
  ).orThrow();
}

/** A command receipt state the journey depends on being `applied`; halts otherwise. */
export function requireApplied(what: string, state: string): void {
  if (state !== 'applied') {
    throw new Error(`${what}: ${state}`);
  }
}

/** The single key that appeared in `after` beyond `before`; halts if not exactly one. */
export function oneNewKey(before: number, after: ReadonlyArray<string>): string {
  const added: ReadonlyArray<string> = after.slice(before);
  if (added.length !== 1) {
    throw new Error(`expected one new command key, saw ${added.length}`);
  }
  return added[0];
}

/** The failure code of a task result: `'succeeded'`, a `TaskFailureCode`, or `'uncoded'`. */
export function codeOf<T>(result: TaskResult<T>): string {
  return result.isSuccess() ? 'succeeded' : result.detail?.code ?? 'uncoded';
}

/** A refusal's code and retry disposition, or `['succeeded']`. */
export function refusalOf<T>(result: TaskResult<T>): ReadonlyArray<string> {
  return result.isSuccess() ? ['succeeded'] : [codeOf(result), result.detail?.retry ?? 'unknown'];
}

/** What a task tool answered when it succeeded. */
export interface IToolAnswer {
  readonly taskId: string;
  readonly state: string;
  readonly revision?: number;
}

const toolAnswer: Converter<IToolAnswer> = Converters.strictObject<IToolAnswer>(
  { taskId: Converters.string, state: Converters.string, revision: Converters.number },
  { optionalFields: ['revision'] }
);

/**
 * A tool's answer: its converted result, or the code word its failure line carries
 * (`<tool>: <code>: …`). Tool failures are plain `Result`s without a detail, so the line is what a
 * model sees, and its code word is fixed by the tool — never host text.
 */
export function answerOf(result: Result<unknown>): IToolAnswer | string {
  return result.isSuccess()
    ? toolAnswer.convert(result.value).orDefault() ?? 'malformed answer'
    : result.message.split(': ')[1] ?? result.message;
}

/** Calls the tool named `name` with `args`, as a harness would. */
export async function callTool(
  tools: ReadonlyArray<AiAssist.IAiClientTool>,
  name: string,
  args: unknown
): Promise<IToolAnswer | string> {
  const tool: AiAssist.IAiClientTool | undefined = tools.find((t) => t.config.name === name);
  return tool === undefined ? `no tool ${name}` : answerOf(await tool.execute(args));
}

/** What the command pump did with one key, as `<action>:<result state>`. */
export function resolutionsFor(resolutions: ReadonlyArray<ICommandResolution>, key: string): string[] {
  return resolutions.filter((r) => r.operationId === key).map((r) => `${r.action}:${r.result?.state ?? '-'}`);
}
