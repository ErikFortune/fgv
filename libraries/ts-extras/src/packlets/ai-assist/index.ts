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
  type AiToolConfig,
  type IAiWebSearchToolConfig,
  type IAiClientToolConfig,
  type IAiClientTool,
  type IAiClientToolCallSummary,
  type IAiClientToolContinuation,
  type IAiClientToolTurnResult,
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
  type AiImageSize,
  type AiImageQuality,
  type DallE2Size,
  type DallE3Size,
  type GptImageSize,
  type DallE3Quality,
  type GptImageQuality,
  type DallEModelNames,
  type GptImageModelNames,
  type GrokImagineModelNames,
  type Imagen4ModelNames,
  type GeminiFlashImageModelNames,
  type IDallEImageGenerationConfig,
  type IGptImageGenerationConfig,
  type IGrokImagineImageGenerationConfig,
  type IImagen4GenerationConfig,
  type IGeminiFlashImageGenerationConfig,
  type IDallEModelOptions,
  type IGptImageModelOptions,
  type IGrokImagineModelOptions,
  type IImagen4ModelOptions,
  type IGeminiFlashImageModelOptions,
  type IOtherModelOptions,
  type IModelFamilyConfig,
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
  type IAiStreamToolUseStart,
  type IAiStreamToolUseDelta,
  type IAiStreamToolUseComplete,
  type IAiStreamDone,
  type IAiStreamError,
  type ModelSpec,
  type ModelSpecKey,
  type IModelSpecMap,
  allModelSpecKeys,
  MODEL_SPEC_BASE_KEY,
  resolveModel,
  toDataUrl,
  type AiThinkingMode,
  type IThinkingConfig,
  type IThinkingProviderConfig,
  type IAnthropicThinkingOptions,
  type IOpenAiThinkingOptions,
  type IGeminiThinkingOptions,
  type IXAiThinkingOptions,
  type IOtherThinkingOptions,
  type IAnthropicThinkingConfig,
  type IOpenAiThinkingConfig,
  type IGeminiThinkingConfig,
  type IXAiThinkingConfig,
  type AnthropicThinkingModelNames,
  type OpenAiThinkingModelNames,
  type GeminiThinkingModelNames,
  type XAiThinkingModelNames
} from './model';

export {
  type IResolvedImageOptions,
  resolveImageOptions,
  validateResolvedOptions
} from './imageOptionsResolver';

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
  type IProviderCompletionStreamParams,
  executeClientToolTurn,
  type IExecuteClientToolTurnParams,
  type IExecuteClientToolTurnResult
} from './streamingClient';

export {
  aiProviderId,
  aiServerToolType,
  aiWebSearchToolConfig,
  aiServerToolConfig,
  aiClientToolConfig,
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
  type IFencedStringifiedJsonExtractorOptions,
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

export { type IResolvedThinkingConfig } from './thinkingOptionsResolver';
