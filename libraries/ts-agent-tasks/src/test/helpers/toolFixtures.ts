/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import { Result } from '@fgv/ts-utils';
import {
  IBoundTaskView,
  IBoundTaskViewParams,
  IBoundTaskWriter,
  ICreateTaskToolsParams,
  ITaskQueryToolResult,
  TaskInspectToolResult,
  createTaskTools
} from '../../index';
import { IBrokerHarness, alpha } from './brokerFixtures';

/** The two read tools, by name. */
export interface ITaskToolPair {
  readonly query: AiAssist.IAiClientTool;
  readonly inspect: AiAssist.IAiClientTool;
}

/** Builds the tools and picks them out by name, failing loudly if either is missing. */
export function taskTools(params: ICreateTaskToolsParams): ITaskToolPair {
  const tools = createTaskTools(params).orThrow();
  const byName = (name: string): AiAssist.IAiClientTool => {
    const tool = tools.find((t) => t.config.name === name);
    if (tool === undefined) {
      throw new Error(`no tool named ${name}`);
    }
    return tool;
  };
  return { query: byName('task_query'), inspect: byName('task_inspect') };
}

/** A read-only view bound to `alice` over `alpha` under the harness policy, unless overridden. */
export function bindReader(harness: IBrokerHarness, params?: Partial<IBoundTaskViewParams>): IBoundTaskView {
  return harness.broker
    .bindView({ principal: 'alice', scopes: [alpha], authorization: harness.policy, ...params })
    .orThrow();
}

/** Runs `task_query` directly — no harness in front — and types its success value. */
export async function query(tools: ITaskToolPair, args: unknown): Promise<Result<ITaskQueryToolResult>> {
  return (await tools.query.execute(args)) as Result<ITaskQueryToolResult>;
}

/** Runs `task_inspect` directly — no harness in front — and types its success value. */
export async function inspect(tools: ITaskToolPair, args: unknown): Promise<Result<TaskInspectToolResult>> {
  return (await tools.inspect.execute(args)) as Result<TaskInspectToolResult>;
}

/**
 * Wraps a view so every property read on it is recorded. `principal` is readable; anything else
 * the tools reach for is recorded, and the recording is the evidence of what they depend on.
 */
export function recordingView(view: IBoundTaskView): { view: IBoundTaskView; touched: Set<string> } {
  const touched: Set<string> = new Set<string>();
  const proxy = new Proxy(view, {
    get(target: IBoundTaskView, property: string | symbol): unknown {
      touched.add(String(property));
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    }
  });
  return { view: proxy, touched };
}

/** The task and unresolved ids a rendered context text shows, in order, parsed from its records. */
export function shownIds(context: string): string[] {
  return context
    .split('\n')
    .filter((line) => line.startsWith('{"task"') || line.startsWith('{"unresolved"'))
    .map((line) => {
      const record = JSON.parse(line) as { task?: string; unresolved?: string };
      return record.task ?? record.unresolved ?? '';
    });
}

/** Every tool the factory built, by name, failing loudly on a missing one. */
export interface IToolSet {
  readonly names: ReadonlyArray<string>;
  get(name: string): AiAssist.IAiClientTool;
}

/** Builds the tools and indexes them by name. */
export function toolSet(params: ICreateTaskToolsParams): IToolSet {
  const tools = createTaskTools(params).orThrow();
  return {
    names: tools.map((t) => t.config.name),
    get: (name: string): AiAssist.IAiClientTool => {
      const tool = tools.find((t) => t.config.name === name);
      if (tool === undefined) {
        throw new Error(`no tool named ${name}`);
      }
      return tool;
    }
  };
}

/**
 * The tools over a writer with every mutation group opted in — the writer is both the view and the
 * writer, as the factory requires.
 */
export function mutatingTools(
  harness: IBrokerHarness,
  writer: IBoundTaskWriter = harness.writer,
  extra?: Partial<ICreateTaskToolsParams>
): IToolSet {
  return toolSet({
    view: writer,
    mutations: { writer, environment: harness.env, enable: ['tracked', 'reassign'] },
    ...extra
  });
}

/** Runs one named tool directly — no harness in front — and types its success value. */
export async function call<T>(tools: IToolSet, name: string, args: unknown): Promise<Result<T>> {
  return (await tools.get(name).execute(args)) as Result<T>;
}
