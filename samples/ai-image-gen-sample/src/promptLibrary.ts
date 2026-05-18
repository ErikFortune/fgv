// Wires `@fgv/ts-prompt-assist` into the sample app. The chat path's
// system prompt is authored as a `(scope, prompt-id)` record with a
// `tone` qualifier-conditional candidate, resolved at send time via
// `PromptLibrary.resolve`.

import {
  Convert,
  IPromptResponseBase,
  IPromptStoreFixtureSeed,
  PromptLibrary,
  PromptStoreFixture
} from '@fgv/ts-prompt-assist';
import { Result, succeed } from '@fgv/ts-utils';

// ---------------------------------------------------------------------------
// Module-scope branded ids (centralised so the `.orThrow()` verbosity
// hits once per module, not per call site).
// ---------------------------------------------------------------------------

export const SCOPE = Convert.scopeKey.convert('global').orThrow();
export const CHAT_SYSTEM_PROMPT = Convert.promptId.convert('chat-system-prompt').orThrow();

// ---------------------------------------------------------------------------
// Authored prompt — base + a `tone: 'formal'` partial.
// ---------------------------------------------------------------------------

const seed: IPromptStoreFixtureSeed = {
  records: [
    {
      scope: SCOPE,
      id: CHAT_SYSTEM_PROMPT,
      // F12: descriptor.id omitted — the outer record.id is the source
      // of truth on the fixture path.
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
  ]
};

// ---------------------------------------------------------------------------
// Typed library handle. `qualifiers: ['tone'] as const` infers
// `TQualifierNames = 'tone'`, so `resolve({ qualifiers: { tonr: ... } })`
// fails at compile time (F3).
// ---------------------------------------------------------------------------

export type ChatPromptLibrary = PromptLibrary<IPromptResponseBase, 'tone'>;

export async function createPromptLibrary(): Promise<Result<ChatPromptLibrary>> {
  const storeResult = await PromptStoreFixture.build(seed);
  if (storeResult.isFailure()) {
    return storeResult.withType<ChatPromptLibrary>();
  }
  return PromptLibrary.create({
    store: storeResult.value,
    qualifiers: ['tone'] as const
  });
}

export type ChatTone = 'neutral' | 'formal';

/**
 * Resolve the chat system prompt under the supplied tone. Returns the
 * resolved body string suitable for use as the `system` field of an
 * `AiPrompt`.
 */
export async function resolveChatSystemPrompt(
  library: ChatPromptLibrary,
  tone: ChatTone
): Promise<Result<string>> {
  const resolved = await library.resolve({
    id: CHAT_SYSTEM_PROMPT,
    chain: [SCOPE],
    // 'neutral' sends `{}` because the base candidate has `conditions: {}`
    // and ts-res treats a missing axis as matching the base. If a future
    // candidate is added with `conditions: { tone: 'neutral' }`, update
    // this to `{ tone }` so the selector can see the value.
    qualifiers: tone === 'formal' ? { tone: 'formal' } : {}
  });
  return resolved.onSuccess((r) => succeed(r.body));
}
