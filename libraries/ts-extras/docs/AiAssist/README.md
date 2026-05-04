[Home](../README.md) > AiAssist

# Namespace: AiAssist

AI assist packlet - provider registry, prompt class, settings, and API client.

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[AiPrompt](./classes/AiPrompt.md)

</td><td>

A structured AI prompt with system/user split for direct API calls,

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IAiWebSearchToolConfig](./interfaces/IAiWebSearchToolConfig.md)

</td><td>

Configuration specific to web search tools.

</td></tr>
<tr><td>

[IAiToolEnablement](./interfaces/IAiToolEnablement.md)

</td><td>

Declares a tool as enabled/disabled in provider settings.

</td></tr>
<tr><td>

[IAiCompletionResponse](./interfaces/IAiCompletionResponse.md)

</td><td>

Result of an AI provider completion call.

</td></tr>
<tr><td>

[IChatMessage](./interfaces/IChatMessage.md)

</td><td>

A single chat message in OpenAI format.

</td></tr>
<tr><td>

[IAiImageModelCapability](./interfaces/IAiImageModelCapability.md)

</td><td>

Image-generation capability for a model family within a provider.

</td></tr>
<tr><td>

[IAiProviderDescriptor](./interfaces/IAiProviderDescriptor.md)

</td><td>

Describes a single AI provider — single source of truth for all metadata.

</td></tr>
<tr><td>

[IAiAssistProviderConfig](./interfaces/IAiAssistProviderConfig.md)

</td><td>

Configuration for a single AI assist provider.

</td></tr>
<tr><td>

[IAiAssistSettings](./interfaces/IAiAssistSettings.md)

</td><td>

AI assist settings — which providers are enabled and their configuration.

</td></tr>
<tr><td>

[IAiAssistKeyStore](./interfaces/IAiAssistKeyStore.md)

</td><td>

Minimal keystore interface for AI assist API key resolution.

</td></tr>
<tr><td>

[IAiImageAttachment](./interfaces/IAiImageAttachment.md)

</td><td>

Image attachment for a vision (image-input) prompt.

</td></tr>
<tr><td>

[IAiImageData](./interfaces/IAiImageData.md)

</td><td>

Universal image representation used for both image input (vision prompts)

</td></tr>
<tr><td>

[IAiImageGenerationOptions](./interfaces/IAiImageGenerationOptions.md)

</td><td>

Options for image generation requests.

</td></tr>
<tr><td>

[IAiImageGenerationParams](./interfaces/IAiImageGenerationParams.md)

</td><td>

Parameters for an image-generation request.

</td></tr>
<tr><td>

[IAiGeneratedImage](./interfaces/IAiGeneratedImage.md)

</td><td>

A single generated image.

</td></tr>
<tr><td>

[IAiImageGenerationResponse](./interfaces/IAiImageGenerationResponse.md)

</td><td>

Result of an image-generation call.

</td></tr>
<tr><td>

[IAiModelCapabilityRule](./interfaces/IAiModelCapabilityRule.md)

</td><td>

One rule in an IAiModelCapabilityConfig.

</td></tr>
<tr><td>

[IAiModelCapabilityConfig](./interfaces/IAiModelCapabilityConfig.md)

</td><td>

Configuration that maps model id patterns to capabilities.

</td></tr>
<tr><td>

[IAiModelInfo](./interfaces/IAiModelInfo.md)

</td><td>

Information about a single model returned by a provider's list endpoint,

</td></tr>
<tr><td>

[IAiStreamTextDelta](./interfaces/IAiStreamTextDelta.md)

</td><td>

A text-content delta arriving during a streaming completion.

</td></tr>
<tr><td>

[IAiStreamToolEvent](./interfaces/IAiStreamToolEvent.md)

</td><td>

A server-side tool progress event arriving during a streaming completion.

</td></tr>
<tr><td>

[IAiStreamDone](./interfaces/IAiStreamDone.md)

</td><td>

Terminal success event for a streaming completion.

</td></tr>
<tr><td>

[IAiStreamError](./interfaces/IAiStreamError.md)

</td><td>

Terminal failure event for a streaming completion.

</td></tr>
<tr><td>

[IModelSpecMap](./interfaces/IModelSpecMap.md)

</td><td>

A model specification: either a simple model string or a record mapping

</td></tr>
<tr><td>

[IProviderCompletionParams](./interfaces/IProviderCompletionParams.md)

</td><td>

Parameters for a provider completion request.

</td></tr>
<tr><td>

[IProviderImageGenerationParams](./interfaces/IProviderImageGenerationParams.md)

</td><td>

Parameters for an image-generation request.

</td></tr>
<tr><td>

[IProviderListModelsParams](./interfaces/IProviderListModelsParams.md)

</td><td>

Parameters for a list-models request.

</td></tr>
<tr><td>

[IProviderCompletionStreamParams](./interfaces/IProviderCompletionStreamParams.md)

</td><td>

Parameters for a streaming completion request.

</td></tr>
<tr><td>

[IFencedStringifiedJsonExtractorOptions](./interfaces/IFencedStringifiedJsonExtractorOptions.md)

</td><td>

Options shared by every AiAssist.fencedStringifiedJson call.

</td></tr>
<tr><td>

[IFencedStringifiedJsonOptions](./interfaces/IFencedStringifiedJsonOptions.md)

</td><td>

Options for the validating overload of AiAssist.fencedStringifiedJson.

</td></tr>
<tr><td>

[IGenerateJsonCompletionParams](./interfaces/IGenerateJsonCompletionParams.md)

</td><td>

Parameters for AiAssist.generateJsonCompletion.

</td></tr>
<tr><td>

[IGenerateJsonCompletionResult](./interfaces/IGenerateJsonCompletionResult.md)

</td><td>

Successful result of AiAssist.generateJsonCompletion.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[AiModelCapability](./type-aliases/AiModelCapability.md)

</td><td>

Capability vocabulary used to describe what a model can do.

</td></tr>
<tr><td>

[AiProviderId](./type-aliases/AiProviderId.md)

</td><td>

All known AI provider identifiers.

</td></tr>
<tr><td>

[AiServerToolType](./type-aliases/AiServerToolType.md)

</td><td>

Built-in server-side tool types supported across providers.

</td></tr>
<tr><td>

[AiServerToolConfig](./type-aliases/AiServerToolConfig.md)

</td><td>

Union of all server-side tool configurations.

</td></tr>
<tr><td>

[AiApiFormat](./type-aliases/AiApiFormat.md)

</td><td>

API format categories for provider routing.

</td></tr>
<tr><td>

[AiImageApiFormat](./type-aliases/AiImageApiFormat.md)

</td><td>

API format categories for image-generation provider routing.

</td></tr>
<tr><td>

[IAiStreamEvent](./type-aliases/IAiStreamEvent.md)

</td><td>

Discriminated union of events emitted by a streaming completion.

</td></tr>
<tr><td>

[ModelSpec](./type-aliases/ModelSpec.md)

</td><td>



</td></tr>
<tr><td>

[ModelSpecKey](./type-aliases/ModelSpecKey.md)

</td><td>

Known context keys for model specification maps.

</td></tr>
<tr><td>

[JsonTextExtractor](./type-aliases/JsonTextExtractor.md)

</td><td>

A function that pulls a JSON-shaped substring out of arbitrary model text.

</td></tr>
<tr><td>

[JsonPromptHint](./type-aliases/JsonPromptHint.md)

</td><td>

Controls the optional system-prompt augmentation applied by
AiAssist.generateJsonCompletion.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[resolveModel](./functions/resolveModel.md)

</td><td>

Resolves a ModelSpec to a concrete model string given an optional context key.

</td></tr>
<tr><td>

[toDataUrl](./functions/toDataUrl.md)

</td><td>

Formats an IAiImageData as a `data:` URL suitable for browser display.

</td></tr>
<tr><td>

[getProviderDescriptors](./functions/getProviderDescriptors.md)

</td><td>

Get all known provider descriptors.

</td></tr>
<tr><td>

[getProviderDescriptor](./functions/getProviderDescriptor.md)

</td><td>

Get a provider descriptor by id.

</td></tr>
<tr><td>

[resolveImageCapability](./functions/resolveImageCapability.md)

</td><td>

Resolve the image-generation capability that applies to a given model id
for a provider.

</td></tr>
<tr><td>

[supportsImageGeneration](./functions/supportsImageGeneration.md)

</td><td>

Whether a provider declares any image-generation capability at all.

</td></tr>
<tr><td>

[callProviderCompletion](./functions/callProviderCompletion.md)

</td><td>

Calls the appropriate chat completion API for a given provider.

</td></tr>
<tr><td>

[callProxiedCompletion](./functions/callProxiedCompletion.md)

</td><td>

Calls the AI completion endpoint on a proxy server instead of calling
the provider API directly from the browser.

</td></tr>
<tr><td>

[callProviderImageGeneration](./functions/callProviderImageGeneration.md)

</td><td>

Calls the appropriate image-generation API for a given provider.

</td></tr>
<tr><td>

[callProxiedImageGeneration](./functions/callProxiedImageGeneration.md)

</td><td>

Calls the image-generation endpoint on a proxy server instead of calling

</td></tr>
<tr><td>

[callProviderListModels](./functions/callProviderListModels.md)

</td><td>

Lists models available from a provider, with capabilities resolved from
native provider info (where supplied) and a configurable rule set.

</td></tr>
<tr><td>

[callProxiedListModels](./functions/callProxiedListModels.md)

</td><td>

Calls the model-listing endpoint on a proxy server.

</td></tr>
<tr><td>

[callProviderCompletionStream](./functions/callProviderCompletionStream.md)

</td><td>

Calls the appropriate streaming chat completion API for a given provider.

</td></tr>
<tr><td>

[callProxiedCompletionStream](./functions/callProxiedCompletionStream.md)

</td><td>

Calls the streaming chat endpoint on a proxy server instead of calling

</td></tr>
<tr><td>

[resolveEffectiveTools](./functions/resolveEffectiveTools.md)

</td><td>

Resolves the effective tools for a completion call.

</td></tr>
<tr><td>

[fencedStringifiedJson](./functions/fencedStringifiedJson.md)

</td><td>

Creates a `Converter` that accepts raw LLM response text, runs it through a

</td></tr>
<tr><td>

[generateJsonCompletion](./functions/generateJsonCompletion.md)

</td><td>

Calls AiAssist.callProviderCompletion, then runs the response text
through a tolerant JSON converter (default:
AiAssist.fencedStringifiedJson) and the caller's
`converter`/`validator`.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[DEFAULT_AI_ASSIST](./variables/DEFAULT_AI_ASSIST.md)

</td><td>

Default AI assist settings (copy-paste only).

</td></tr>
<tr><td>

[allModelSpecKeys](./variables/allModelSpecKeys.md)

</td><td>

All valid ModelSpecKey values.

</td></tr>
<tr><td>

[MODEL_SPEC_BASE_KEY](./variables/MODEL_SPEC_BASE_KEY.md)

</td><td>

Default context key used as fallback when resolving a ModelSpec.

</td></tr>
<tr><td>

[allProviderIds](./variables/allProviderIds.md)

</td><td>

All valid provider ID values, in the same order as the registry.

</td></tr>
<tr><td>

[DEFAULT_MODEL_CAPABILITY_CONFIG](./variables/DEFAULT_MODEL_CAPABILITY_CONFIG.md)

</td><td>

Default capability config used by `callProviderListModels` when callers
don't supply their own.

</td></tr>
<tr><td>

[aiProviderId](./variables/aiProviderId.md)

</td><td>

Converter for AiProviderId.

</td></tr>
<tr><td>

[aiServerToolType](./variables/aiServerToolType.md)

</td><td>

Converter for AiServerToolType.

</td></tr>
<tr><td>

[aiWebSearchToolConfig](./variables/aiWebSearchToolConfig.md)

</td><td>

Converter for IAiWebSearchToolConfig.

</td></tr>
<tr><td>

[aiServerToolConfig](./variables/aiServerToolConfig.md)

</td><td>

Converter for AiServerToolConfig (discriminated union on `type`).

</td></tr>
<tr><td>

[aiToolEnablement](./variables/aiToolEnablement.md)

</td><td>

Converter for IAiToolEnablement.

</td></tr>
<tr><td>

[aiAssistProviderConfig](./variables/aiAssistProviderConfig.md)

</td><td>

Converter for IAiAssistProviderConfig.

</td></tr>
<tr><td>

[aiAssistSettings](./variables/aiAssistSettings.md)

</td><td>

Converter for IAiAssistSettings.

</td></tr>
<tr><td>

[modelSpecKey](./variables/modelSpecKey.md)

</td><td>

Converter for ModelSpecKey.

</td></tr>
<tr><td>

[modelSpec](./variables/modelSpec.md)

</td><td>

Recursive converter for ModelSpec.

</td></tr>
<tr><td>

[extractJsonText](./variables/extractJsonText.md)

</td><td>

Default AiAssist.JsonTextExtractor | extractor for LLM responses.

</td></tr>
<tr><td>

[SMART_JSON_PROMPT_HINT](./variables/SMART_JSON_PROMPT_HINT.md)

</td><td>

Default system-prompt suffix appended when AiAssist.IGenerateJsonCompletionParams.promptHint
is `'smart'` (the default).

</td></tr>
</tbody></table>
