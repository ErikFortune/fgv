/**
 * AI assist packlet - provider registry, prompt class, settings, and API client.
 * @packageDocumentation
 */

export {
  AiPrompt,
  type AiModelCapability,
  type AiProviderId,
  type AiServerToolType,
  type AiServerToolConfig,
  type IAiWebSearchToolConfig,
  type IAiToolEnablement,
  type IAiCompletionResponse,
  type IChatMessage,
  type AiApiFormat,
  type AiImageApiFormat,
  type IAiImageModelCapability,
  type IAiProviderDescriptor,
  type IAiAssistProviderConfig,
  type IAiAssistSettings,
  DEFAULT_AI_ASSIST,
  type IAiAssistKeyStore,
  type IAiImageAttachment,
  type IAiImageData,
  type IAiImageGenerationOptions,
  type IAiImageGenerationParams,
  type IAiGeneratedImage,
  type IAiImageGenerationResponse,
  type IAiModelCapabilityRule,
  type IAiModelCapabilityConfig,
  type IAiModelInfo,
  type IAiStreamEvent,
  type IAiStreamTextDelta,
  type IAiStreamToolEvent,
  type IAiStreamDone,
  type IAiStreamError,
  type ModelSpec,
  type ModelSpecKey,
  type IModelSpecMap,
  allModelSpecKeys,
  MODEL_SPEC_BASE_KEY,
  resolveModel,
  toDataUrl
} from './model';

export {
  allProviderIds,
  getProviderDescriptors,
  getProviderDescriptor,
  resolveImageCapability,
  supportsImageGeneration,
  DEFAULT_MODEL_CAPABILITY_CONFIG
} from './registry';

export {
  callProviderCompletion,
  callProxiedCompletion,
  callProviderImageGeneration,
  callProxiedImageGeneration,
  callProviderListModels,
  callProxiedListModels,
  type IProviderCompletionParams,
  type IProviderImageGenerationParams,
  type IProviderListModelsParams
} from './apiClient';

export {
  callProviderCompletionStream,
  callProxiedCompletionStream,
  type IProviderCompletionStreamParams
} from './streamingClient';

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

export {
  extractJsonText,
  fencedStringifiedJson,
  type IFencedStringifiedJsonOptions,
  type JsonTextExtractor
} from './jsonResponse';

export {
  generateJsonCompletion,
  SMART_JSON_PROMPT_HINT,
  type IGenerateJsonCompletionParams,
  type IGenerateJsonCompletionResult,
  type JsonPromptHint
} from './jsonCompletion';
