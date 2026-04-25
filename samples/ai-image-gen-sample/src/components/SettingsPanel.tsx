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
  /** Models fetched via listModels for this provider, filtered to image-generation. */
  readonly availableModels: ReadonlyArray<AiAssist.IAiModelInfo>;
  readonly isFetchingModels: boolean;
  readonly modelListError: string | undefined;
  readonly onFetchModels: () => void;
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
    onModelChange,
    availableModels,
    isFetchingModels,
    modelListError,
    onFetchModels
  } = props;
  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();
  const datalistId = `model-suggestions-${provider}`;
  const canFetchModels = apiKey.length > 0 && !isFetchingModels;

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

      <div className="mt-4">
        <div className="flex items-end gap-2">
          <label className="block flex-1 text-sm">
            <span className="font-medium text-slate-700">Model</span>
            <input
              type="text"
              list={datalistId}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={modelPlaceholder}
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            disabled={!canFetchModels}
            onClick={onFetchModels}
            className="h-[38px] shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            {isFetchingModels ? 'Fetching…' : 'Fetch available'}
          </button>
        </div>

        <datalist id={datalistId}>
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName ?? m.id}
            </option>
          ))}
        </datalist>

        {modelListError !== undefined ? (
          <p className="mt-2 text-xs text-red-700">
            <span className="font-semibold">List failed:</span> {modelListError}. You can still type a model
            name manually.
          </p>
        ) : availableModels.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            {availableModels.length} image-capable model
            {availableModels.length === 1 ? '' : 's'} found — start typing to filter the dropdown.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Override the model name when the registry default isn&apos;t available on your API tier, or click{' '}
            <strong>Fetch available</strong> after entering an API key to see what your account can use.
          </p>
        )}
      </div>

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
