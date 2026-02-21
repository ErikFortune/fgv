import React from 'react';

export function SecuritySection(): React.ReactElement {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Keystore</p>
                <p className="text-xs text-gray-500">No keystore configured</p>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-400 cursor-not-allowed bg-white"
            >
              Set / Change Password
            </button>
            <p className="mt-2 text-xs text-gray-400">Keystore management coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
