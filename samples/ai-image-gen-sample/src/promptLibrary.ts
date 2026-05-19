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
import { Converter, Converters, Result, succeed } from '@fgv/ts-utils';

// ---------------------------------------------------------------------------
// Module-scope branded ids (centralised so the `.orThrow()` verbosity
// hits once per module, not per call site).
// ---------------------------------------------------------------------------

export const SCOPE = Convert.scopeKey.convert('global').orThrow();
export const CHAT_SYSTEM_PROMPT = Convert.promptId.convert('chat-system-prompt').orThrow();

// ---------------------------------------------------------------------------
// Single source of truth for the qualifier-axis NAMES this sample uses.
// Threads through three places (B-3):
//   1. `qualifiers: qualifierNames` on `PromptLibrary.create` — narrows the
//      resolve-request `qualifiers` shape (F3).
//   2. `IPromptStoreFixtureSeed<QualifierName>` on the seed — narrows the
//      candidate `conditions` keys at compile time (a typo'd `tonr` is a
//      build-time error here in the sample).
//   3. `qualifierNameConverter` on the seed — narrows the YAML loader at
//      convert time (a runtime-cast escape-hatch typo still fails at load
//      time).
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
          // B-3: `tone` is narrowed against `QualifierName`. A typo'd
          // axis name (e.g. `tonr`) would fail at compile time on this
          // seed type AND at convert time via the `qualifierNameConverter`
          // below — closing the cast-pressure failure mode end-to-end.
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
// Typed library handle. `qualifiers: qualifierNames` infers
// `TQualifierNames = 'tone'`, so `resolve({ qualifiers: { tonr: ... } })`
// fails at compile time (F3).
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
