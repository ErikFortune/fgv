/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Result, succeed } from '@fgv/ts-utils';
import {
  IPromptResolveRequest,
  IPromptSafetyPolicy,
  IPromptSlot,
  IPromptStore,
  IResolvedPrompt,
  IScopeSlotBindingsRecord,
  IStoredPromptRecord,
  PromptId,
  PromptLibrary,
  PromptStoreFixture,
  ScopeKey,
  SlotName
} from '@fgv/ts-prompt-assist';
import {
  ITaskContext,
  ITaskPromptRequest,
  ITaskPromptRecordParams,
  TaskContextRenderer,
  taskPromptRecord
} from '../../index';
import { input, summary } from './contextFixtures';

export const promptId: PromptId = 'agent' as PromptId;
export const globalScope: ScopeKey = 'global' as ScopeKey;
export const tenantScope: ScopeKey = 'tenant' as ScopeKey;
export const personaSlot: SlotName = 'persona' as SlotName;

/** The host's fixed instructions — literal text at the head of every test prompt. */
export const instructions: string = 'You coordinate research work for a small team.';

/** The host's own stable slot, declared frozen: its value is an app-held constant. */
export const persona: IPromptSlot = {
  name: personaSlot,
  description: 'Who the agent is; an application constant.',
  cacheStability: 'frozen'
};

export const personaText: string = 'You are Ada, careful and brief.';

/** The standard prompt: instructions, rules, a frozen persona slot, then the task slot. */
export function standardRecord(over?: Partial<ITaskPromptRecordParams>): IStoredPromptRecord {
  return taskPromptRecord({
    scope: globalScope,
    id: promptId,
    title: 'agent',
    instructions,
    stableSlots: [persona],
    ...over
  }).orThrow();
}

/** A record with a hand-written body, keeping the standard descriptor. */
export function recordWithBody(body: string, slots?: ReadonlyArray<IPromptSlot>): IStoredPromptRecord {
  const base: IStoredPromptRecord = standardRecord();
  return {
    ...base,
    descriptor: { ...base.descriptor, ...(slots !== undefined ? { slots } : {}) },
    candidates: [{ conditions: {}, body }]
  };
}

/** A real prompt library over an in-memory store seeded with `records`. */
export async function library(
  records: ReadonlyArray<IStoredPromptRecord>,
  options?: {
    readonly bindings?: ReadonlyArray<IScopeSlotBindingsRecord>;
    readonly safetyPolicy?: IPromptSafetyPolicy;
  }
): Promise<PromptLibrary> {
  const store: IPromptStore = (
    await PromptStoreFixture.build({
      records: [...records],
      ...(options?.bindings !== undefined ? { bindings: [...options.bindings] } : {})
    })
  ).orThrow();
  return (
    await PromptLibrary.create({
      store,
      qualifiers: [],
      ...(options?.safetyPolicy !== undefined ? { safetyPolicy: options.safetyPolicy } : {})
    })
  ).orThrow();
}

/** The standard request: the persona substituted, the task slot left to the helper. */
export const request: ITaskPromptRequest = {
  id: promptId,
  chain: [globalScope],
  qualifiers: {},
  substitutions: { persona: personaText }
};

const renderer: TaskContextRenderer = TaskContextRenderer.create().orThrow();

/** Renders a snapshot context from wire task summaries. */
export function render(tasks: ReadonlyArray<JsonValue>, deliveryId?: string): ITaskContext {
  return renderer
    .render(input({ tasks: [...tasks], ...(deliveryId !== undefined ? { deliveryId } : {}) }))
    .orThrow();
}

/** A running task with `completed` of 10 steps done, described by `title`. */
export function task(id: string, revision: number, completed: number, title?: string): JsonValue {
  return summary(id, revision, {
    ...(title !== undefined ? { title } : {}),
    progress: { completed, total: 10 }
  });
}

/** A rough tokenizer — four characters to a token — standing in for a model's. */
export function measure(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * A library that resolves through a real one, then edits what it returns — standing in for any host
 * `ITaskPromptLibrary` whose answer does not describe its own body. Used only to reach checks that a
 * real `PromptLibrary` never fails; every positive claim is made against the real library.
 */
export class EditingLibrary {
  private readonly _inner: PromptLibrary;
  private readonly _edit: (resolved: IResolvedPrompt) => IResolvedPrompt;

  public constructor(inner: PromptLibrary, edit: (resolved: IResolvedPrompt) => IResolvedPrompt) {
    this._inner = inner;
    this._edit = edit;
  }

  public async resolve(req: IPromptResolveRequest): Promise<Result<IResolvedPrompt>> {
    return (await this._inner.resolve(req)).onSuccess((resolved: IResolvedPrompt) =>
      succeed(this._edit(resolved))
    );
  }
}
