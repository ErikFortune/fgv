/**
 * AI assist packlet - prompt generation and JSON-to-entity glue for ingredient creation.
 * @packageDocumentation
 */

export { buildIngredientAiPrompt } from './ingredientPrompt';
export { parseIngredientJson, AI_NOTE_CATEGORY, type IIngredientParseResult } from './ingredientFromJson';
