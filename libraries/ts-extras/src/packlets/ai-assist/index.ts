/**
 * AI assist packlet - provider registry, prompt class, and API client.
 * @packageDocumentation
 */

export {
  AiPrompt,
  type AiProviderId,
  type IAiCompletionResponse,
  type IChatMessage,
  type AiApiFormat,
  type IAiProviderDescriptor
} from './model';

export { allProviderIds, getProviderDescriptors, getProviderDescriptor } from './registry';

export { callProviderCompletion, type IProviderCompletionParams } from './apiClient';
