/**
 * AI assist packlet - prompt generation and note helpers for entity creation.
 * @packageDocumentation
 */

export { AI_NOTE_CATEGORY, extractAiNote } from './normalizeNotes';

export { type IAiPrompt, createAiPrompt } from './model';

export { buildIngredientAiPrompt } from './ingredientPrompt';

export { buildMoldAiPrompt } from './moldPrompt';

export { buildFillingAiPrompt } from './fillingPrompt';

export { buildProcedureAiPrompt } from './procedurePrompt';

export { buildDecorationAiPrompt } from './decorationPrompt';

export {
  callChatCompletion,
  callAnthropicCompletion,
  callGeminiCompletion,
  callProviderCompletion,
  getApiConfig,
  PROVIDER_DEFAULTS,
  type IChatMessage,
  type IAiApiConfig,
  type IAiApiRequestParams
} from './apiClient';
