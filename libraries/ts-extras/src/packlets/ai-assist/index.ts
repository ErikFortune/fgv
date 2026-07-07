/**
 * AI assist packlet - provider registry, prompt class, settings, and API client.
 * @packageDocumentation
 */

export {
  AiPrompt,
  type AiModelCapability,
  allModelCapabilities,
  type AiProviderId,
  type AiServerToolType,
  type AiServerToolConfig,
  type AiToolConfig,
  type IAiWebSearchToolConfig,
  type IAiClientToolConfig,
  type IAiToolAnnotations,
  type IAiClientTool,
  type IAiClientToolCallSummary,
  type IAiClientToolContinuation,
  type IAiClientToolTurnResult,
  type IAiToolEnablement,
  type IAiCompletionResponse,
  type IChatMessage,
  type IChatRequest,
  type AiApiFormat,
  type AiImageApiFormat,
  type AiEmbeddingApiFormat,
  type AiEmbeddingTaskType,
  type IAiEmbeddingModelCapability,
  type IAiEmbeddingParams,
  type IAiEmbeddingUsage,
  type IAiEmbeddingResult,
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
  type GptImageSize,
  type GptImageQuality,
  type GptImageModelNames,
  type GrokImagineModelNames,
  type GeminiFlashImageModelNames,
  type IGptImageGenerationConfig,
  type IGrokImagineImageGenerationConfig,
  type IGeminiFlashImageGenerationConfig,
  type IGptImageModelOptions,
  type IGrokImagineModelOptions,
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
  type IModelAliasMap,
  MODEL_ALIAS_SIGIL,
  resolveModelAlias,
  resolveProviderModel,
  isResponsesOnlyModel,
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
  resolveEmbeddingCapability,
  supportsEmbedding,
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
  callProviderEmbedding,
  callProxiedEmbedding,
  type IProviderEmbeddingParams
} from './embeddingClient';

export {
  callProviderCompletionStream,
  callProxiedCompletionStream,
  type IProviderCompletionStreamParams,
  executeClientToolTurn,
  type IExecuteClientToolTurnParams,
  type IExecuteClientToolTurnResult,
  type IToolExecutionDecision
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

export { anthropicEffortToBudgetTokens, type IResolvedThinkingConfig } from './thinkingOptionsResolver';
