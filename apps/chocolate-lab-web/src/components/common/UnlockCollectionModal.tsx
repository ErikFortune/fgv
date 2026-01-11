/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
import { Modal } from './Modal';
import { LockOpenIcon, KeyIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useChocolate, type IUnlockOptions } from '../../contexts/ChocolateContext';

/**
 * Props for the UnlockCollectionModal component
 */
export interface IUnlockCollectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Collection ID to unlock */
  collectionId: string;
}

type InputMode = 'password' | 'key' | 'file';

/**
 * Modal for unlocking encrypted collections
 */
export function UnlockCollectionModal({
  isOpen,
  onClose,
  collectionId
}: IUnlockCollectionModalProps): React.ReactElement {
  const { unlockCollection } = useChocolate();
  const [inputMode, setInputMode] = useState<InputMode>('password');
  const [password, setPassword] = useState('');
  const [keyBase64, setKeyBase64] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSalt, setCustomSalt] = useState('');
  const [customIterations, setCustomIterations] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let options: IUnlockOptions;

      if (inputMode === 'password') {
        options = {
          mode: 'password',
          password,
          salt: customSalt || undefined,
          iterations: customIterations ? parseInt(customIterations, 10) : undefined
        };
      } else if (inputMode === 'key') {
        options = {
          mode: 'key',
          keyBase64
        };
      } else {
        setError('File input not yet implemented');
        setIsLoading(false);
        return;
      }

      const result = await unlockCollection(collectionId, options);

      if (result.isSuccess()) {
        // Reset form and close
        setPassword('');
        setKeyBase64('');
        setCustomSalt('');
        setCustomIterations('');
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={handleClose}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="unlock-form"
        disabled={isLoading || (inputMode === 'password' && !password) || (inputMode === 'key' && !keyBase64)}
        className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 dark:bg-chocolate-500 dark:hover:bg-chocolate-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Unlocking...
          </>
        ) : (
          <>
            <LockOpenIcon className="w-4 h-4" />
            Unlock
          </>
        )}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Unlock "${collectionId}"`} footer={footer}>
      <form id="unlock-form" onSubmit={handleSubmit}>
        {/* Input mode tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            type="button"
            onClick={() => setInputMode('password')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              inputMode === 'password'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <LockOpenIcon className="w-4 h-4" />
            Password
          </button>
          <button
            type="button"
            onClick={() => setInputMode('key')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              inputMode === 'key'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <KeyIcon className="w-4 h-4" />
            Key
          </button>
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              inputMode === 'file'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            File
          </button>
        </div>

        {/* Password input */}
        {inputMode === 'password' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-transparent"
                placeholder="Enter password..."
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The key will be derived using PBKDF2 with SHA-256
              </p>
            </div>

            {/* Advanced options toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-chocolate-600 dark:text-chocolate-400 hover:underline"
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced options
            </button>

            {showAdvanced && (
              <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <label
                    htmlFor="salt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Salt (base64)
                  </label>
                  <input
                    type="text"
                    id="salt"
                    value={customSalt}
                    onChange={(e) => setCustomSalt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-transparent text-sm font-mono"
                    placeholder="Use default salt..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="iterations"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Iterations
                  </label>
                  <input
                    type="number"
                    id="iterations"
                    value={customIterations}
                    onChange={(e) => setCustomIterations(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-transparent text-sm"
                    placeholder="100000"
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Direct key input */}
        {inputMode === 'key' && (
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Encryption Key (base64)
            </label>
            <input
              type="text"
              id="key"
              value={keyBase64}
              onChange={(e) => setKeyBase64(e.target.value)}
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter 32-byte key in base64..."
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              A 32-byte AES-256 key encoded as base64 (44 characters)
            </p>
          </div>
        )}

        {/* File input */}
        {inputMode === 'file' && (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Secrets file support coming soon</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              For now, use the password or key options
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
