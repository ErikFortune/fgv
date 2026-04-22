[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IResolutionContextOptions

# Interface: IResolutionContextOptions

Configuration options for the resolution context controls in ResolutionView.

Controls the visibility and behavior of the context configuration panel,
allowing hosts to customize which qualifiers are editable and provide
externally managed context values. Uses QualifierControlOptions for
per-qualifier customization.

## Example

```tsx
// Hide context UI entirely - host controls context externally
<ResolutionView
  contextOptions={{ showContextControls: false }}
  // ... other props
/>

// Fine-grained qualifier control
<ResolutionView
  contextOptions={{
    showContextControls: true,
    qualifierOptions: {
      language: { editable: true, placeholder: 'Select language...' },
      platform: { editable: false, hostValue: 'web', showHostValue: true },
      env: { visible: false } // Hidden from UI entirely
    },
    hostManagedValues: { env: 'production' } // Invisible but active
  }}
  // ... other props
/>
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="contextpanelclassname"></a> `contextPanelClassName?` | `string` | Additional CSS classes for the context panel |
| <a id="contextpaneltitle"></a> `contextPanelTitle?` | `string` | Custom title for the context configuration panel |
| <a id="defaultqualifiereditable"></a> `defaultQualifierEditable?` | `boolean` | Global defaults for qualifiers not specifically configured |
| <a id="defaultqualifiervisible"></a> `defaultQualifierVisible?` | `boolean` | - |
| <a id="globalplaceholder"></a> `globalPlaceholder?` | `string` \| (`qualifierName`) => `string` | Global placeholder text pattern for qualifier inputs |
| <a id="hostmanagedvalues"></a> `hostManagedValues?` | `Record`\<`string`, `string` \| `undefined`\> | Host-managed values that override all user input for invisible qualifiers |
| <a id="qualifieroptions"></a> `qualifierOptions?` | `Record`\<`string`, [`IQualifierControlOptions`](IQualifierControlOptions.md)\> | Per-qualifier control options |
| <a id="showcontextactions"></a> `showContextActions?` | `boolean` | Whether to show the Apply/Reset buttons |
| <a id="showcontextcontrols"></a> `showContextControls?` | `boolean` | Whether to show the context configuration panel at all |
| <a id="showcurrentcontext"></a> `showCurrentContext?` | `boolean` | Whether to show the current context display |
