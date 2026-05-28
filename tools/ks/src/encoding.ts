import { CryptoUtils } from '@fgv/ts-extras';
import { Result, fail, succeed } from '@fgv/ts-utils';

export type Encoding = 'text' | 'base64' | 'hex';

export const ENCODINGS: readonly Encoding[] = ['text', 'base64', 'hex'];

export const DEFAULT_ENCODING: Encoding = 'text';

export function parseEncoding(value: string | undefined): Result<Encoding> {
  if (value === undefined) {
    return succeed(DEFAULT_ENCODING);
  }
  const normalized = value.toLowerCase();
  if (normalized === 'text' || normalized === 'base64' || normalized === 'hex') {
    return succeed(normalized);
  }
  return fail(`Invalid encoding '${value}'. Expected one of: ${ENCODINGS.join(', ')}`);
}

export function encodeSecret(value: string, encoding: Encoding): string {
  if (encoding === 'text') {
    return value;
  }
  const bytes = new TextEncoder().encode(value);
  if (encoding === 'base64') {
    return CryptoUtils.toBase64(bytes);
  }
  return Buffer.from(bytes).toString('hex');
}
