import React, { useCallback, useEffect, useState } from 'react';

import type { IPreferencesDraft } from '../useSettingsDraft';

// ============================================================================
// Props
// ============================================================================

export interface IServicesSectionProps {
  readonly aiAssist: IPreferencesDraft['aiAssist'];
  readonly onChange: (updates: Partial<IPreferencesDraft>) => void;
}

// ============================================================================
// Health check status
// ============================================================================

type HealthStatus = 'unknown' | 'connected' | 'unreachable';

const HEALTH_CHECK_INTERVAL_MS: number = 15_000;

function StatusDot({ status }: { readonly status: HealthStatus }): React.ReactElement {
  const colors: Record<HealthStatus, string> = {
    unknown: 'bg-gray-300',
    connected: 'bg-green-500',
    unreachable: 'bg-red-500'
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`} />;
}

function statusLabel(status: HealthStatus): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'unreachable':
      return 'Unreachable';
    default:
      return 'Not configured';
  }
}

// ============================================================================
// Component
// ============================================================================

export function ServicesSection(props: IServicesSectionProps): React.ReactElement {
  const { aiAssist, onChange } = props;
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('unknown');

  const proxyUrl: string = aiAssist.proxyUrl ?? '';

  // Health check effect
  useEffect(() => {
    if (!proxyUrl) {
      setHealthStatus('unknown');
      return;
    }

    let cancelled: boolean = false;

    async function checkHealth(): Promise<void> {
      try {
        const response = await fetch(`${proxyUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        if (!cancelled) {
          setHealthStatus(response.ok ? 'connected' : 'unreachable');
        }
      } catch {
        if (!cancelled) {
          setHealthStatus('unreachable');
        }
      }
    }

    checkHealth().catch(() => undefined);
    const intervalId: ReturnType<typeof setInterval> = setInterval(() => {
      checkHealth().catch(() => undefined);
    }, HEALTH_CHECK_INTERVAL_MS);

    return (): void => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [proxyUrl]);

  const updateAiAssist = useCallback(
    (updates: Partial<IPreferencesDraft['aiAssist']>): void => {
      onChange({ aiAssist: { ...aiAssist, ...updates } });
    },
    [aiAssist, onChange]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Services</h2>
        <p className="text-sm text-gray-500 mb-4">
          Configure the backend API server. Required for providers with CORS restrictions (e.g. xAI Grok).
        </p>
      </div>

      {/* Proxy URL + status */}
      <div>
        <label htmlFor="services-proxy-url" className="block text-xs font-medium text-gray-500 mb-1">
          Backend URL
        </label>
        <div className="flex items-center gap-3">
          <input
            id="services-proxy-url"
            type="text"
            className="w-full max-w-[400px] px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-accent focus:border-transparent"
            placeholder="http://localhost:3002"
            defaultValue={proxyUrl}
            onBlur={(e): void => updateAiAssist({ proxyUrl: e.target.value || undefined })}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusDot status={healthStatus} />
            <span className="text-xs text-gray-500">{statusLabel(healthStatus)}</span>
          </div>
        </div>
      </div>

      {/* Route all through proxy toggle */}
      <div className="flex items-start gap-3">
        <input
          id="services-proxy-all"
          type="checkbox"
          checked={aiAssist.proxyAllProviders === true}
          disabled={!proxyUrl}
          onChange={(e): void => updateAiAssist({ proxyAllProviders: e.target.checked || undefined })}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-choco-accent focus:ring-choco-accent disabled:opacity-30"
        />
        <label
          htmlFor="services-proxy-all"
          className={`text-sm ${proxyUrl ? 'text-gray-700' : 'text-gray-400'}`}
        >
          <span className="font-medium">Route all providers through proxy</span>
          <p className="text-xs text-gray-400 mt-0.5">
            When enabled, all AI requests go through the backend. When disabled, only CORS-restricted
            providers (currently xAI Grok) use the proxy.
          </p>
        </label>
      </div>
    </div>
  );
}
