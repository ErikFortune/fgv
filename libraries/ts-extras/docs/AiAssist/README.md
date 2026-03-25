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

[IModelSpecMap](./interfaces/IModelSpecMap.md)

</td><td>

A model specification: either a simple model string or a record mapping

</td></tr>
<tr><td>

[IProviderCompletionParams](./interfaces/IProviderCompletionParams.md)

</td><td>

Parameters for a provider completion request.

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

[ModelSpec](./type-aliases/ModelSpec.md)

</td><td>



</td></tr>
<tr><td>

[ModelSpecKey](./type-aliases/ModelSpecKey.md)

</td><td>

Known context keys for model specification maps.

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

[resolveEffectiveTools](./functions/resolveEffectiveTools.md)

</td><td>

Resolves the effective tools for a completion call.

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
</tbody></table>
