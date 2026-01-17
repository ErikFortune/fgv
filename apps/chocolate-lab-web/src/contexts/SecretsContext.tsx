/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Crypto } from '@fgv/ts-chocolate';

export interface IStoredSecret {
  keyBase64: string;
  keyDerivation?: Crypto.IKeyDerivationParams;
}

export interface ISecretsContext {
  secrets: Record<string, IStoredSecret>;
  setSecret: (secretName: string, secret: IStoredSecret) => void;
  clearSecret: (secretName: string) => void;
  getSecretKeyBase64: (secretName: string) => string | undefined;
  getKeyDerivation: (secretName: string) => Crypto.IKeyDerivationParams | undefined;
}

const defaultSecretsContext: ISecretsContext = {
  secrets: {},
  setSecret: () => {},
  clearSecret: () => {},
  getSecretKeyBase64: () => undefined,
  getKeyDerivation: () => undefined
};

export const SecretsContext = createContext<ISecretsContext>(defaultSecretsContext);

export function SecretsProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [secrets, setSecrets] = useState<Record<string, IStoredSecret>>({});

  const setSecret = useCallback((secretName: string, secret: IStoredSecret) => {
    setSecrets((prev) => ({ ...prev, [secretName]: secret }));
  }, []);

  const clearSecret = useCallback((secretName: string) => {
    setSecrets((prev) => {
      const next = { ...prev };
      delete next[secretName];
      return next;
    });
  }, []);

  const getSecretKeyBase64 = useCallback(
    (secretName: string): string | undefined => {
      return secrets[secretName]?.keyBase64;
    },
    [secrets]
  );

  const getKeyDerivation = useCallback(
    (secretName: string): Crypto.IKeyDerivationParams | undefined => {
      return secrets[secretName]?.keyDerivation;
    },
    [secrets]
  );

  const value = useMemo(
    (): ISecretsContext => ({
      secrets,
      setSecret,
      clearSecret,
      getSecretKeyBase64,
      getKeyDerivation
    }),
    [secrets, setSecret, clearSecret, getSecretKeyBase64, getKeyDerivation]
  );

  return <SecretsContext.Provider value={value}>{children}</SecretsContext.Provider>;
}

export function useSecrets(): ISecretsContext {
  return useContext(SecretsContext);
}
