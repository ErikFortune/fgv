import matchers from './matchers';
import './types';

export { IMockFileConfig as MockFileConfig, MockFileSystem } from './helpers';

type JestGlobal = typeof global & { expect: jest.Expect };

function isJestGlobal(g: typeof global): g is JestGlobal {
  return g.hasOwnProperty('expect');
}

/* c8 ignore else */
if (isJestGlobal(global)) {
  global.expect.extend(matchers);
} else {
  console.error(
    [
      "Unable to find Jest's global expect",
      'Please check that you have added ts-utils-jest correctly to your jest configuration.'
    ].join('\n')
  );
}
