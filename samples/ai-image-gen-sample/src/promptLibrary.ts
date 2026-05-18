// Wires up a minimal ts-prompt-assist library for the chat path's
// system prompt. One scope ('global'), one prompt id
// ('chat-system-prompt'), and a single `tone` qualifier with two
// candidates: a base "helpful assistant" voice and a tone=formal
// override. Used by App.tsx as the system-prompt source instead of a
// hardcoded string.

import { Convert, IPromptStoreFixtureSeed, PromptLibrary, PromptStoreFixture } from '@fgv/ts-prompt-assist';
import { QualifierTypes, Qualifiers } from '@fgv/ts-res';
import { Result, fail, succeed } from '@fgv/ts-utils';

export const TONE_AXIS = 'tone';
export const SYSTEM_PROMPT_SCOPE = Convert.scopeKey.convert('global').orThrow();
export const SYSTEM_PROMPT_ID = Convert.promptId.convert('chat-system-prompt').orThrow();

export type Tone = 'base' | 'formal';

const SYSTEM_PROMPT_SEED: IPromptStoreFixtureSeed = {
  records: [
    {
      scope: SYSTEM_PROMPT_SCOPE,
      id: SYSTEM_PROMPT_ID,
      descriptor: {
        id: SYSTEM_PROMPT_ID,
        title: 'Chat system prompt',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'free-text' }
      },
      candidates: [
        // Base candidate — byte-identical to the previous hardcoded
        // string so a tone=base resolve preserves prior behaviour.
        { conditions: {}, body: 'You are a helpful assistant.' },
        // Partial override layered on top of the base when tone=formal.
        // The merged body becomes "You are a helpful assistant.\n\n…"
        // which exercises the partial-layering path.
        {
          conditions: { [TONE_AXIS]: 'formal' },
          isPartial: true,
          body:
            'Adopt a formal register: address the user respectfully, avoid contractions, and prefer ' +
            'precise vocabulary over colloquialisms.'
        }
      ]
    }
  ]
};

export async function buildChatPromptLibrary(): Promise<Result<PromptLibrary>> {
  const qualifierTypes = QualifierTypes.QualifierTypeCollector.create({
    qualifierTypes: [QualifierTypes.LiteralQualifierType.create({ name: TONE_AXIS }).orThrow()]
  }).orThrow();
  const qualifiers = Qualifiers.QualifierCollector.create({
    qualifierTypes,
    qualifiers: [{ name: TONE_AXIS, typeName: TONE_AXIS, defaultPriority: 500 }]
  }).orThrow();

  const storeResult = await PromptStoreFixture.build(SYSTEM_PROMPT_SEED);
  if (storeResult.isFailure()) {
    // Re-fail so the Failure<T> type parameter matches the outer Result<PromptLibrary>.
    // (Result's Failure variant is invariant in T at the type level, so a Failure<IPromptStore>
    // does not assign to Result<PromptLibrary> — see pressure-test finding F13.)
    return fail(storeResult.message);
  }
  return PromptLibrary.create({ store: storeResult.value, qualifiers });
}

export async function resolveSystemPrompt(library: PromptLibrary, tone: Tone): Promise<Result<string>> {
  const qualifierContext: Readonly<Record<string, string>> =
    tone === 'formal' ? { [TONE_AXIS]: 'formal' } : {};
  return (
    await library.resolve({
      id: SYSTEM_PROMPT_ID,
      chain: [SYSTEM_PROMPT_SCOPE],
      qualifiers: qualifierContext
    })
  ).onSuccess((resolved) => succeed(resolved.body));
}
