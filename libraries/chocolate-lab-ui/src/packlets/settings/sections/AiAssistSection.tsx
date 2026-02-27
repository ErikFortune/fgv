import React, { useCallback } from 'react';

import { AiAssist } from '@fgv/ts-extras';

import type { IPreferencesDraft } from '../useSettingsDraft';

// ============================================================================
// Props
// ============================================================================

export interface IAiAssistSectionProps {
  readonly aiAssist: IPreferencesDraft['aiAssist'];
  readonly onChange: (updates: Partial<IPreferencesDraft>) => void;
}

// ============================================================================
// Component
// ============================================================================

export function AiAssistSection(props: IAiAssistSectionProps): React.ReactElement {
  const { aiAssist, onChange } = props;

  const enabledMap = new Map(aiAssist.providers.map((p) => [p.provider, p]));

  // Resolve which provider is the current default
  const effectiveDefault: AiAssist.AiProviderId =
    aiAssist.defaultProvider && enabledMap.has(aiAssist.defaultProvider)
      ? aiAssist.defaultProvider
      : aiAssist.providers[0]?.provider ?? 'copy-paste';

  const updateSettings = useCallback(
    (updates: Partial<AiAssist.IAiAssistSettings>): void => {
      onChange({ aiAssist: { ...aiAssist, ...updates } });
    },
    [aiAssist, onChange]
  );

  const updateProviders = useCallback(
    (newProviders: ReadonlyArray<AiAssist.IAiAssistProviderConfig>): void => {
      updateSettings({ providers: newProviders });
    },
    [updateSettings]
  );

  const handleToggle = useCallback(
    (descriptor: AiAssist.IAiProviderDescriptor, enabled: boolean): void => {
      if (enabled) {
        updateProviders([...aiAssist.providers, { provider: descriptor.id }]);
      } else {
        const newProviders = aiAssist.providers.filter((p) => p.provider !== descriptor.id);
        // If removing the default provider, clear the explicit default
        const newDefault = aiAssist.defaultProvider === descriptor.id ? undefined : aiAssist.defaultProvider;
        updateSettings({ providers: newProviders, defaultProvider: newDefault });
      }
    },
    [aiAssist, updateProviders, updateSettings]
  );

  const handleDefaultChange = useCallback(
    (provider: AiAssist.AiProviderId): void => {
      updateSettings({ defaultProvider: provider });
    },
    [updateSettings]
  );

  const handleSecretNameChange = useCallback(
    (provider: AiAssist.AiProviderId, secretName: string): void => {
      updateProviders(
        aiAssist.providers.map((p) =>
          p.provider === provider ? { ...p, secretName: secretName || undefined } : p
        )
      );
    },
    [aiAssist.providers, updateProviders]
  );

  const handleModelChange = useCallback(
    (provider: AiAssist.AiProviderId, model: string): void => {
      updateProviders(
        aiAssist.providers.map((p) => (p.provider === provider ? { ...p, model: model || undefined } : p))
      );
    },
    [aiAssist.providers, updateProviders]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">AI Assist</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enable AI providers for entity generation. Copy/Paste is always available.
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="py-2 pr-3 w-8">On</th>
              <th className="py-2 pr-2 w-10">Def</th>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">API Key Secret</th>
              <th className="py-2">Model</th>
            </tr>
          </thead>
          <tbody>
            {AiAssist.getProviderDescriptors().map((descriptor) => {
              const config = enabledMap.get(descriptor.id);
              const isEnabled = config !== undefined;
              const isCopyPaste = descriptor.id === 'copy-paste';
              const isDefault = effectiveDefault === descriptor.id;

              return (
                <tr key={descriptor.id} className="border-b border-gray-100">
                  <td className="py-2.5 pr-3">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={isCopyPaste}
                      onChange={(e): void => handleToggle(descriptor, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-choco-accent focus:ring-choco-accent disabled:opacity-50"
                    />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="radio"
                      name="ai-assist-default"
                      checked={isDefault}
                      disabled={!isEnabled}
                      onChange={(): void => handleDefaultChange(descriptor.id)}
                      className="w-4 h-4 border-gray-300 text-choco-accent focus:ring-choco-accent disabled:opacity-30"
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={isEnabled ? 'text-gray-900' : 'text-gray-400'}>{descriptor.label}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    {descriptor.needsSecret ? (
                      <input
                        type="text"
                        disabled={!isEnabled}
                        className="w-full max-w-[200px] px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-accent focus:border-transparent disabled:opacity-40 disabled:bg-gray-50"
                        placeholder="secret name"
                        defaultValue={config?.secretName ?? ''}
                        onBlur={(e): void => handleSecretNameChange(descriptor.id, e.target.value)}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    {descriptor.needsSecret ? (
                      <input
                        type="text"
                        disabled={!isEnabled}
                        className="w-full max-w-[180px] px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-accent focus:border-transparent disabled:opacity-40 disabled:bg-gray-50"
                        placeholder={descriptor.defaultModel || 'model'}
                        defaultValue={config?.model ?? ''}
                        onBlur={(e): void => handleModelChange(descriptor.id, e.target.value)}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">&mdash;</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
