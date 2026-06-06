import * as TsUtils from '@fgv/ts-utils';

export function exercisePacklets(): {
  hash: string;
  validationOk: boolean;
  converted: string;
  collectionSize: number;
  logMessage?: string;
} {
  // hash
  const hash = TsUtils.Hash.Crc32Normalizer.crc32Hash(['hello']);

  // validation
  const validationOk = TsUtils.Validators.string.validate('abc').isSuccess();

  // conversion
  const converted = TsUtils.Converters.string.convert('123').orDefault('');

  // collections
  const rm = new TsUtils.ResultMap<string, number>([['a', 1]]);
  const collectionSize = rm.size;

  // logging
  const logger = new TsUtils.Logging.InMemoryLogger('info');
  const logMessage = logger.info('Testing ts-utils').orDefault(undefined);

  return { hash, validationOk, converted, collectionSize, logMessage };
}

// Make something visible when running in the browser
const result = exercisePacklets();
const app = document.getElementById('app');
if (app) {
  app.textContent = JSON.stringify(result);
}
