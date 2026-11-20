/**
 * Wires `@fgv/ts-prompt-assist` into the `streaming-chat` scenario. The chat path's
 * system prompt is authored as a `(scope, prompt-id)` record with a `tone`
 * qualifier-conditional candidate, resolved at send time via `PromptLibrary.resolve`.
 *
 * Ported near-verbatim from `samples/ai-image-gen-sample/src/promptLibrary.ts` — the
 * ts-prompt-assist tone demo is the differentiator this scenario ports, per the
 * `testbed-web-scenarios` brief.
 *
 * @packageDocumentation
 */

import { Convert, PromptLibrary, PromptStoreFixture } from '@fgv/ts-prompt-assist';
import type { IPromptResponseBase, IPromptStoreFixtureSeed, PromptId, ScopeKey } from '@fgv/ts-prompt-assist';
import { Converters, succeed } from '@fgv/ts-utils';
import type { Converter, Result } from '@fgv/ts-utils';

// ---------------------------------------------------------------------------
// Module-scope branded ids (centralised so the `.orThrow()` verbosity
// hits once per module, not per call site).
// ---------------------------------------------------------------------------

export const SCOPE: ScopeKey = Convert.scopeKey.convert('global').shouldNotFail('SCOPE');
export const CHAT_SYSTEM_PROMPT: PromptId = Convert.promptId
  .convert('chat-system-prompt')
  .shouldNotFail('CHAT_SYSTEM_PROMPT');

// ---------------------------------------------------------------------------
// Single source of truth for the qualifier-axis NAMES this scenario uses.
// ---------------------------------------------------------------------------

const qualifierNames = ['tone'] as const;
export type QualifierName = (typeof qualifierNames)[number];

const qualifierNameConverter: Converter<QualifierName> = Converters.enumeratedValue<QualifierName>([
  ...qualifierNames
]);

// ---------------------------------------------------------------------------
// Authored prompt — base + a `tone: 'formal'` partial.
// ---------------------------------------------------------------------------

const seed: IPromptStoreFixtureSeed<QualifierName> = {
  records: [
    {
      scope: SCOPE,
      id: CHAT_SYSTEM_PROMPT,
      descriptor: {
        title: 'Chat system prompt',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'free-text' }
      },
      candidates: [
        {
          conditions: {},
          body: 'You are a helpful assistant. Answer the user clearly and concisely.'
        },
        {
          conditions: { tone: 'formal' },
          isPartial: true,
          body: 'When responding, use a formal register: complete sentences, no contractions, and a measured, professional tone.'
        }
      ]
    }
  ],
  qualifierNameConverter
};

// ---------------------------------------------------------------------------
// Typed library handle.
// ---------------------------------------------------------------------------

export type ChatPromptLibrary = PromptLibrary<IPromptResponseBase, QualifierName>;

export async function createPromptLibrary(): Promise<Result<ChatPromptLibrary>> {
  const storeResult = await PromptStoreFixture.build(seed);
  if (storeResult.isFailure()) {
    return storeResult.withType<ChatPromptLibrary>();
  }
  return PromptLibrary.create({
    store: storeResult.value,
    qualifiers: qualifierNames
  });
}

// ---------------------------------------------------------------------------
// Consumer-side qualifier-VALUE enum.
// ---------------------------------------------------------------------------

export const chatTones = ['neutral', 'formal'] as const;
export type ChatTone = (typeof chatTones)[number];
export const chatToneConverter: Converter<ChatTone> = Converters.enumeratedValue<ChatTone>([...chatTones]);

/**
 * Resolve the chat system prompt under the supplied tone. Returns the resolved body
 * string suitable for use as the `system` field of an `AiPrompt`.
 */
export async function resolveChatSystemPrompt(
  library: ChatPromptLibrary,
  tone: ChatTone
): Promise<Result<string>> {
  const resolved = await library.resolve({
    id: CHAT_SYSTEM_PROMPT,
    chain: [SCOPE],
    // 'neutral' sends `{}` because the base candidate has `conditions: {}` and ts-res
    // treats a missing axis as matching the base.
    qualifiers: tone === 'formal' ? { tone: 'formal' } : {}
  });
  return resolved.onSuccess((r) => succeed(r.body));
}
