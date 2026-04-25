import { AiAssist } from '@fgv/ts-extras';
import { fail, Result, succeed } from '@fgv/ts-utils';

/**
 * Sample-only keystore that holds API keys in memory for the current session.
 *
 * The real `KeyStore` from `@fgv/ts-extras` persists secrets to encrypted
 * storage. For a sample app we don't need that — keys are typed once per
 * session and live in the React tree's state.
 */
export class InMemoryKeyStore implements AiAssist.IAiAssistKeyStore {
  private readonly _secrets: Map<string, string>;

  public constructor(initial?: ReadonlyMap<string, string>) {
    this._secrets = new Map(initial ?? []);
  }

  public get isUnlocked(): boolean {
    return true;
  }

  public hasSecret(name: string): Result<boolean> {
    return succeed(this._secrets.has(name));
  }

  public getApiKey(name: string): Result<string> {
    const value = this._secrets.get(name);
    if (value === undefined || value.length === 0) {
      return fail(`secret "${name}" not set`);
    }
    return succeed(value);
  }
}
