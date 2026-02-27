/**
 * AI assist packlet - provider registry, prompt class, and API client.
 * @packageDocumentation
 */

export { AiPrompt, type IChatMessage, type AiApiFormat, type IAiProviderDescriptor } from './model';

export { type AiProviderId, allProviderIds, getProviderDescriptors, getProviderDescriptor } from './registry';

export { callProviderCompletion, type IProviderCompletionParams } from './apiClient';
