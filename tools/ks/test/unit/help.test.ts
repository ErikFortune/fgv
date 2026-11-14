import '@fgv/ts-utils-jest';
import { Command } from 'commander';

import { getHelpText } from '../../src/help';

describe('help text', () => {
  test('getHelpText without a topic returns the overview', () => {
    expect(getHelpText()).toSucceedAndSatisfy((helpText) => {
      expect(helpText).toContain('ks manages ts-extras keystore files.');
      expect(helpText).toContain('ks help template');
    });
  });

  test('getHelpText for template includes template guidance', () => {
    expect(getHelpText('template')).toSucceedAndSatisfy((helpText) => {
      expect(helpText).toContain('ks export template format');
      expect(helpText).toContain('--template-string <text>');
      expect(helpText).toContain('{{xai}}');
    });
  });

  test('getHelpText for password includes password sources', () => {
    expect(getHelpText('password')).toSucceedAndSatisfy((helpText) => {
      expect(helpText).toContain('FGV_KS_PASSWORD');
      expect(helpText).toContain('KS_PASSWORD');
      expect(helpText).toContain('ks session --var FGV_KS_PASSWORD');
    });
  });

  test('getHelpText rejects unknown topics', () => {
    expect(getHelpText('missing')).toFailWith(
      "Unknown help topic 'missing'. Available topics: overview, commands, password, template"
    );
  });

  test('getHelpText can return command-specific help when a program is provided', () => {
    const program = new Command().name('ks').description('Manage ts-extras keystore files');
    program.command('put <name>').description('Store a secret in the keystore');

    expect(getHelpText('put', program)).toSucceedAndSatisfy((helpText) => {
      expect(helpText).toContain('Usage: ks put [options] <name>');
      expect(helpText).toContain('Store a secret in the keystore');
    });
  });
});
