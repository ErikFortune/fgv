import * as TsUtils from '@fgv/ts-utils';

export function exercisePacklets(): {
  hash: string;
  validationOk: boolean;
  converted: string;
  collectionSize: number;
  logMessage?: string;
} {
  // hash
  const hash = (TsUtils as Record<string, any>)['Hash'].Crc32Normalizer.crc32Hash(['hello']);

  // validation
  const validationOk = (TsUtils as Record<string, any>)['Validation'].Validators.string
    .validate('abc')
    .isSuccess();

  // conversion
  const converted = (TsUtils as Record<string, any>)['Conversion'].Converters.string
    .convert('123')
    .orDefault('');

  // collections
  const rm = new (TsUtils as Record<string, any>)['Collections'].ResultMap<string, number>([['a', 1]]);
  const collectionSize = rm.size;

  // logging
  const logger = new (TsUtils as Record<string, any>)['Logging'].InMemoryLogger('info');
  const logMessage = logger.info('Testing ts-utils').orDefault(undefined);

  return { hash, validationOk, converted, collectionSize, logMessage };
}

// Make something visible when running in the browser
const result = exercisePacklets();
const app = document.getElementById('app');
if (app) {
  app.textContent = JSON.stringify(result);
}
