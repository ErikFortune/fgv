[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiImageModelCapability

# Interface: IAiImageModelCapability

Image-generation capability for a model family within a provider. Used as
an entry in `imageGeneration`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-acceptedqualities"></a> `acceptedQualities?` | `readonly` | readonly `string`[] | Accepted quality values when supportsQualityParam is true. |
| <a id="property-acceptedsizes"></a> `acceptedSizes?` | `readonly` | readonly `string`[] | Accepted size strings. When present, dispatcher pre-validates. |
| <a id="property-acceptsimagereferenceinput"></a> `acceptsImageReferenceInput?` | `readonly` | `boolean` | Whether matching models accept reference images via [AiAssist.IAiImageGenerationParams.referenceImages](IAiImageGenerationParams.md#property-referenceimages). When false or undefined, calls that include reference images are rejected up front. |
| <a id="property-defaultoutputmimetype"></a> `defaultOutputMimeType?` | `readonly` | `string` | Default MIME type for response images. |
| <a id="property-format"></a> `format` | `readonly` | [`AiImageApiFormat`](../type-aliases/AiImageApiFormat.md) | API format used to dispatch requests for matching models. |
| <a id="property-maxcount"></a> `maxCount?` | `readonly` | `number` | Maximum count (n). When present, dispatcher pre-validates. |
| <a id="property-modelprefix"></a> `modelPrefix` | `readonly` | `string` | Prefix matched against the resolved image model id. The empty string is the catch-all and matches every model. When multiple rules' prefixes match a model id, the longest prefix wins; ties are broken by first-encountered. |
| <a id="property-outputparamstyle"></a> `outputParamStyle?` | `readonly` | `"none"` \| `"response-format"` \| `"output-format"` | How to encode the output format on the wire: - 'response-format': send response_format: 'b64_json' (openai-images catch-all) - 'output-format': send output_format (gpt-image-1) - 'none': send neither (Gemini Flash) |
| <a id="property-supportsqualityparam"></a> `supportsQualityParam?` | `readonly` | `boolean` | When true, quality param is sent. When false/undefined, don't send quality. |
