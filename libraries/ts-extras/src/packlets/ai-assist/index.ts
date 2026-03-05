/**
 * AI assist packlet - provider registry, prompt class, settings, and API client.
 * @packageDocumentation
 */

export {
  AiPrompt,
  type AiProviderId,
  type AiServerToolType,
  type AiServerToolConfig,
  type IAiWebSearchToolConfig,
  type IAiToolEnablement,
  type IAiCompletionResponse,
  type IChatMessage,
  type AiApiFormat,
  type IAiProviderDescriptor,
  type IAiAssistProviderConfig,
  type IAiAssistSettings,
  DEFAULT_AI_ASSIST,
  type IAiAssistKeyStore,
  type ModelSpec,
  type ModelSpecKey,
  type IModelSpecMap,
  allModelSpecKeys,
  MODEL_SPEC_BASE_KEY,
  resolveModel
} from './model';

export { allProviderIds, getProviderDescriptors, getProviderDescriptor } from './registry';

export { callProviderCompletion, type IProviderCompletionParams } from './apiClient';

export {
  aiProviderId,
  aiServerToolType,
  aiWebSearchToolConfig,
  aiServerToolConfig,
  aiToolEnablement,
  aiAssistProviderConfig,
  aiAssistSettings,
  modelSpecKey,
  modelSpec
} from './converters';

export { resolveEffectiveTools } from './toolFormats';
