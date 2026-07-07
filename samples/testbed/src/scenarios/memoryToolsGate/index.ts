// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * `@fgv/ts-agent-memory` L2 agent-tool surface — the mediated-write gate, end-to-end.
 *
 * Demonstrates {@link createMemoryTools} wired through `AiAssist.executeClientToolTurn` WITHOUT a
 * live model. The provider stream is **mocked** (a canned Anthropic tool_use SSE stream substituted
 * for `global.fetch`), so the scenario is deterministic and requires no API key.
 *
 * The agent "calls" `memory_write` on a real (in-memory) `FileTreeMemoryStore`; a host
 * `onBeforeToolExecute` gate keeps writes curation-mediated:
 *
 * - **Run 1 (mediated deny):** the gate denies the mutating `memory_write` call pending
 *   confirmation. `execute` never runs; a synthesized denial tool-result is fed into the
 *   continuation (the model sees the denial). The store is left untouched (verified via `store.get`).
 * - **Run 2 (confirmed):** the same gate proceeds the call; `memory_write` runs and the record is
 *   durably persisted (verified via `store.get`).
 *
 * Scope isolation is structural: the tools close over a pre-scoped store and no tool argument
 * names a scope — the agent cannot steer at another actor's memory.
 *
 * CLI-only and self-contained (mocked stream, no live API), matching the `gateDenyClientTools`
 * convention.
 *
 * @packageDocumentation
 */

import { Converters, fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { AiAssist } from '@fgv/ts-extras';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  HybridRetriever,
  IIdentityCodec,
  Kind,
  KnowledgeIdentityCodec,
  MemoryIndex,
  ScoreUnionMergeStrategy,
  StructuredFilterRetriever,
  createMemoryTools
} from '@fgv/ts-agent-memory';

import type { IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';

const KNOWLEDGE_KIND: Kind = 'knowledge' as Kind;

// ---------------------------------------------------------------------------
// Mocked provider stream (Anthropic tool_use SSE) — no live API
// ---------------------------------------------------------------------------

/** Builds a canned Anthropic SSE stream in which the model calls `toolName` with `argsJson`. */
function anthropicToolUseSse(toolId: string, toolName: string, argsJson: string): string[] {
  return [
    `event: content_block_start\ndata: ${JSON.stringify({
      index: 0,
      content_block: { type: 'tool_use', id: toolId, name: toolName }
    })}\n\n`,
    `event: content_block_delta\ndata: ${JSON.stringify({
      index: 0,
      delta: { type: 'input_json_delta', partial_json: argsJson }
    })}\n\n`,
    `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
    `event: message_delta\ndata: ${JSON.stringify({ delta: { stop_reason: 'tool_use' } })}\n\n`,
    `event: message_stop\ndata: {}\n\n`
  ];
}

/** Installs a mocked `global.fetch` returning the given SSE chunks; returns a restore fn. */
function installMockFetch(chunks: ReadonlyArray<string>): () => void {
  const original = global.fetch;
  const encoder = new TextEncoder();
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    }
  });
  const response = {
    ok: true,
    status: 200,
    body,
    text: async (): Promise<string> => '',
    headers: new Map([['content-type', 'text/event-stream']])
  };
  global.fetch = (async () => response) as unknown as typeof global.fetch;
  return () => {
    global.fetch = original;
  };
}

// ---------------------------------------------------------------------------
// Memory substrate + tools
// ---------------------------------------------------------------------------

/** Build a fresh in-memory knowledge store and the selected memory tools over it. */
function buildMemory(): Result<{
  store: FileTreeMemoryStore;
  tools: ReadonlyArray<AiAssist.IAiClientTool>;
}> {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    return fail('expected a mutable root directory');
  }
  const registry = BodyConverterRegistry.create().orThrow();
  registry.register(KNOWLEDGE_KIND, Converters.string);
  const codecs = new Map<Kind, IIdentityCodec>([[KNOWLEDGE_KIND, new KnowledgeIdentityCodec()]]);
  return FileTreeMemoryStore.create({ root, registry, codecs }).onSuccess((store) => {
    const retriever = HybridRetriever.create(
      [StructuredFilterRetriever.create(MemoryIndex.create().orThrow()).orThrow()],
      ScoreUnionMergeStrategy.create().orThrow()
    ).orThrow();
    const tools = createMemoryTools({
      store,
      retriever,
      registry,
      codecs,
      // Writes are opt-in; enable memory_write to demonstrate the mediated-write gate.
      tools: ['memory_write', 'memory_search'],
      // Host handle vocabulary: the agent sees mnemonics, not raw ids.
      handleFor: (record) => `@${record.envelope.id}`
    });
    return succeed({ store, tools });
  });
}

/** The host gate: deny mutating memory tools pending confirmation; proceed everything else. */
function makeGate(
  confirmed: boolean
): (tool: AiAssist.IAiClientTool, args: unknown) => Promise<Result<AiAssist.IToolExecutionDecision>> {
  const mutating = new Set<string>(['memory_write', 'memory_delete']);
  return async (tool) =>
    !confirmed && mutating.has(tool.config.name)
      ? succeed({ action: 'deny', reason: 'memory write requires host confirmation (curation-mediated)' })
      : succeed({ action: 'proceed' });
}

// ---------------------------------------------------------------------------
// CLI implementation
// ---------------------------------------------------------------------------

const WRITE_ARGS: string = JSON.stringify({
  kind: 'knowledge',
  entityId: 'note-1',
  body: 'the user prefers dark mode'
});

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    const descriptorResult = AiAssist.getProviderDescriptor('anthropic');
    if (descriptorResult.isFailure()) {
      return fail(`Failed to get Anthropic descriptor: ${descriptorResult.message}`);
    }
    const descriptor = descriptorResult.value;
    const request: AiAssist.IChatRequest = {
      system: 'You curate the user’s long-lived memory.',
      messages: [{ role: 'user', content: 'Remember that I prefer dark mode.' }]
    };
    const summary: string[] = ['memory-tools mediated-write gate (mocked stream, no live API)', ''];

    // --- Run 1: memory_write DENIED (curation-mediated) ------------------
    const denied = await buildMemory();
    if (denied.isFailure()) {
      return fail(`run 1 setup failed: ${denied.message}`);
    }
    const restore1 = installMockFetch(anthropicToolUseSse('toolu_w1', 'memory_write', WRITE_ARGS));
    try {
      const turn = AiAssist.executeClientToolTurn({
        descriptor,
        apiKey: 'mock-key',
        ...request,
        clientTools: denied.value.tools,
        model: 'claude-sonnet-4-6',
        onBeforeToolExecute: makeGate(false)
      });
      if (turn.isFailure()) {
        return fail(`deny-run executeClientToolTurn failed: ${turn.message}`);
      }
      let denyResult = '';
      for await (const event of turn.value.events) {
        if (event.type === 'client-tool-result') {
          denyResult = event.result;
        } else if (event.type === 'error') {
          return fail(`deny-run stream error: ${event.message}`);
        }
      }
      const outcome = await turn.value.nextTurn;
      if (outcome.isFailure()) {
        return fail(`deny-run nextTurn failed (should continue): ${outcome.message}`);
      }
      const persisted = await denied.value.store.get(KNOWLEDGE_KIND, 'note-1' as EntityId);
      if (persisted.isFailure()) {
        return fail(`deny-run store.get failed: ${persisted.message}`);
      }
      if (persisted.value !== undefined) {
        return fail('deny-path assertion failed: a record was persisted despite the deny gate');
      }
      context.logger.info(`[run 1] memory_write DENIED — store untouched; denial: ${denyResult}`);
      summary.push('Run 1 (memory_write): DENIED by host gate');
      summary.push(`  - execute() never ran; synthesized denial fed into the continuation`);
      summary.push('  - store.get(note-1) === undefined (nothing persisted)');
    } finally {
      restore1();
    }

    // --- Run 2: memory_write CONFIRMED → persisted -----------------------
    const confirmed = await buildMemory();
    if (confirmed.isFailure()) {
      return fail(`run 2 setup failed: ${confirmed.message}`);
    }
    const restore2 = installMockFetch(anthropicToolUseSse('toolu_w2', 'memory_write', WRITE_ARGS));
    try {
      const turn = AiAssist.executeClientToolTurn({
        descriptor,
        apiKey: 'mock-key',
        ...request,
        clientTools: confirmed.value.tools,
        model: 'claude-sonnet-4-6',
        onBeforeToolExecute: makeGate(true)
      });
      if (turn.isFailure()) {
        return fail(`confirm-run executeClientToolTurn failed: ${turn.message}`);
      }
      let writeIsError = true;
      for await (const event of turn.value.events) {
        if (event.type === 'client-tool-result') {
          writeIsError = event.isError;
        } else if (event.type === 'error') {
          return fail(`confirm-run stream error: ${event.message}`);
        }
      }
      const outcome = await turn.value.nextTurn;
      if (outcome.isFailure()) {
        return fail(`confirm-run nextTurn failed: ${outcome.message}`);
      }
      if (writeIsError) {
        return fail('confirm-path assertion failed: memory_write result was flagged isError');
      }
      const persisted = await confirmed.value.store.get(KNOWLEDGE_KIND, 'note-1' as EntityId);
      if (persisted.isFailure() || persisted.value === undefined) {
        return fail('confirm-path assertion failed: record was not persisted after a proceed decision');
      }
      context.logger.info(
        `[run 2] memory_write CONFIRMED — persisted note-1: "${String(persisted.value.body)}"`
      );
      summary.push('');
      summary.push('Run 2 (memory_write): PROCEEDED under host confirmation');
      summary.push(
        `  - record durably persisted: store.get(note-1).body = "${String(persisted.value.body)}"`
      );
    } finally {
      restore2();
    }

    summary.push('');
    summary.push('memory-tools-gate scenario: PASS');
    return succeed(summary.join('\n'));
  }
};

/**
 * `@fgv/ts-agent-memory` L2 mediated-write gate scenario.
 *
 * Self-contained (mocked provider stream; no live API / key) demonstration of `createMemoryTools`
 * driven through `AiAssist.executeClientToolTurn`, with an `onBeforeToolExecute` gate keeping
 * `memory_write` curation-mediated.
 *
 * @public
 */
export const memoryToolsGateScenario: IScenario = {
  id: 'memory-tools-gate',
  title: 'Agent Memory Tools — Mediated Write Gate',
  description:
    'Self-contained (mocked stream, no live API) demonstration of @fgv/ts-agent-memory createMemoryTools ' +
    'wired through executeClientToolTurn: a host onBeforeToolExecute gate denies a memory_write pending ' +
    'confirmation (store untouched), then proceeds it (record durably persisted).',
  category: 'ai',
  tags: ['agent-memory', 'client-tools', 'tool-use', 'gate', 'memory', 'mocked'],
  cli: cliImpl
};
