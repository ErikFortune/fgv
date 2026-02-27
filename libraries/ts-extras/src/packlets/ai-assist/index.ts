/**
 * AI assist packlet - provider registry, prompt class, settings, and API client.
 * @packageDocumentation
 */

export {
  AiPrompt,
  type AiProviderId,
  type IAiCompletionResponse,
  type IChatMessage,
  type AiApiFormat,
  type IAiProviderDescriptor,
  type IAiAssistProviderConfig,
  type IAiAssistSettings,
  DEFAULT_AI_ASSIST,
  type IAiAssistKeyStore
} from './model';

export { allProviderIds, getProviderDescriptors, getProviderDescriptor } from './registry';

export { callProviderCompletion, type IProviderCompletionParams } from './apiClient';

export { aiProviderId, aiAssistProviderConfig, aiAssistSettings } from './converters';
