/**
 * AI assist packlet - prompt generation and note helpers for entity creation.
 *
 * Generic AI infrastructure (provider registry, prompt class, API client)
 * is in `@fgv/ts-extras` AiAssist namespace.
 *
 * @packageDocumentation
 */

export { AI_NOTE_CATEGORY, extractAiNote } from './normalizeNotes';

export { buildIngredientAiPrompt } from './ingredientPrompt';

export { buildMoldAiPrompt } from './moldPrompt';

export { buildFillingAiPrompt } from './fillingPrompt';

export { buildProcedureAiPrompt } from './procedurePrompt';

export { buildDecorationAiPrompt } from './decorationPrompt';
