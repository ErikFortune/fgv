/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
import { KeyIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { Crypto } from '@fgv/ts-chocolate';
import { Modal } from './Modal';
import type { Result } from '@fgv/ts-utils';
import { fail, succeed } from '@fgv/ts-utils';
import { useSecrets } from '../../contexts/SecretsContext';

type InputMode = 'password' | 'key';

export interface IProvideSecretModalProps {
  isOpen: boolean;
  secretName: string;
  onClose: () => void;
  onProvided: () => void;
}

function decodeBase64(value: string): Result<Uint8Array> {
  try {
    return succeed(Uint8Array.from(atob(value), (c) => c.charCodeAt(0)));
  } catch (e) {
    return fail(`Invalid base64: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function encodeBase64(bytes: Uint8Array): Result<string> {
  try {
    const raw = Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join('');
    return succeed(btoa(raw));
  } catch (e) {
    return fail(`Failed to encode key: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function ProvideSecretModal({
  isOpen,
  secretName,
  onClose,
  onProvided
}: IProvideSecretModalProps): React.ReactElement {
  const { setSecret } = useSecrets();
  const [inputMode, setInputMode] = useState<InputMode>('password');
  const [password, setPassword] = useState('');
  const [keyBase64, setKeyBase64] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSalt, setCustomSalt] = useState('');
  const [customIterations, setCustomIterations] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cryptoResult = Crypto.createBrowserCryptoProvider();
      if (cryptoResult.isFailure()) {
        setError(`Crypto not available: ${cryptoResult.message}`);
        return;
      }
      const cryptoProvider = cryptoResult.value;

      if (inputMode === 'key') {
        const decoded = decodeBase64(keyBase64);
        if (decoded.isFailure()) {
          setError(decoded.message);
          return;
        }
        if (decoded.value.length !== 32) {
          setError(`Key must be 32 bytes (got ${decoded.value.length})`);
          return;
        }

        setSecret(secretName, { keyBase64 });
        setPassword('');
        setKeyBase64('');
        setCustomSalt('');
        setCustomIterations('');
        onProvided();
        onClose();
        return;
      }

      if (!password) {
        setError('Password is required');
        return;
      }

      const iterations = customIterations ? parseInt(customIterations, 10) : 100000;
      if (Number.isNaN(iterations) || iterations < 1) {
        setError('Iterations must be a positive number');
        return;
      }

      let saltBytes: Uint8Array;
      let saltBase64: string;

      if (customSalt) {
        const decodedSalt = decodeBase64(customSalt);
        if (decodedSalt.isFailure()) {
          setError(decodedSalt.message);
          return;
        }
        saltBytes = decodedSalt.value;
        saltBase64 = customSalt;
      } else {
        const generated = await cryptoProvider.generateKey();
        if (generated.isFailure()) {
          setError(generated.message);
          return;
        }
        saltBytes = generated.value.slice(0, 16);
        const encodedSalt = encodeBase64(saltBytes);
        if (encodedSalt.isFailure()) {
          setError(encodedSalt.message);
          return;
        }
        saltBase64 = encodedSalt.value;
      }

      const keyResult = await cryptoProvider.deriveKey(password, saltBytes, iterations);
      if (keyResult.isFailure()) {
        setError(keyResult.message);
        return;
      }

      const encodedKey = encodeBase64(keyResult.value);
      if (encodedKey.isFailure()) {
        setError(encodedKey.message);
        return;
      }

      setSecret(secretName, {
        keyBase64: encodedKey.value,
        keyDerivation: {
          kdf: 'pbkdf2',
          salt: saltBase64,
          iterations
        }
      });

      setPassword('');
      setKeyBase64('');
      setCustomSalt('');
      setCustomIterations('');
      onProvided();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="provide-secret-form"
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
            Saving...
          </>
        ) : (
          <>
            <KeyIcon className="w-4 h-4" />
            Save
          </>
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) {
          setError(null);
          onClose();
        }
      }}
      title={`Provide secret "${secretName}"`}
      footer={footer}
    >
      <form id="provide-secret-form" onSubmit={handleSubmit}>
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
        </div>

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
            </div>

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
                    placeholder="Leave blank to generate"
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
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
