import { AiAssist } from '@fgv/ts-extras';

export interface ISettingsPanelProps {
  readonly providers: ReadonlyArray<AiAssist.AiProviderId>;
  readonly provider: AiAssist.AiProviderId;
  readonly onProviderChange: (provider: AiAssist.AiProviderId) => void;
  readonly apiKey: string;
  readonly onApiKeyChange: (key: string) => void;
  readonly model: string;
  readonly modelPlaceholder: string;
  readonly onModelChange: (model: string) => void;
}

export function SettingsPanel(props: ISettingsPanelProps): React.JSX.Element {
  const {
    providers,
    provider,
    onProviderChange,
    apiKey,
    onApiKeyChange,
    model,
    modelPlaceholder,
    onModelChange
  } = props;
  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Provider</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Provider</span>
          <select
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as AiAssist.AiProviderId)}
          >
            {providers.map((p) => {
              const d = AiAssist.getProviderDescriptor(p).orDefault();
              return (
                <option key={p} value={p}>
                  {d?.label ?? p}
                </option>
              );
            })}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">API key</span>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={`Paste your ${descriptor?.label ?? provider} API key`}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-slate-700">Model</span>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder={modelPlaceholder}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <span className="mt-1 block text-xs text-slate-500">
          Override the model name when the registry default isn&apos;t available on your API tier (e.g. Imagen
          versions rotate frequently).
        </span>
      </label>

      {descriptor?.corsRestricted && (
        <p className="mt-3 text-xs">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
            CORS-restricted (proxy required for production)
          </span>
        </p>
      )}
    </section>
  );
}
