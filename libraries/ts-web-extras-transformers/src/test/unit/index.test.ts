import { PROVISIONAL_SCAFFOLD } from '../../index';

describe('@fgv/ts-web-extras-transformers (B-1 scaffold)', () => {
  test('package imports cleanly and exports the B-1 sentinel', () => {
    expect(PROVISIONAL_SCAFFOLD).toBe('local-ai-exploration:B-1');
  });
});
