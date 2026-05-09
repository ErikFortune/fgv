import '@fgv/ts-utils-jest';

import { extractTemplateVariables, renderShellTemplate, shellQuote } from '../../src/template';

describe('template helpers', () => {
  test('shellQuote wraps values in single quotes and escapes embedded quotes', () => {
    expect(shellQuote("abc'def")).toBe("'abc'\"'\"'def'");
  });

  test('extractTemplateVariables reads simple template variables', () => {
    expect(extractTemplateVariables('export XAI_API_KEY={{xai}}')).toSucceedWith(['xai']);
  });

  test('renderShellTemplate renders shell-quoted export values', () => {
    expect(renderShellTemplate('export XAI_API_KEY={{xai}}', { xai: "abc'def" })).toSucceedWith(
      "export XAI_API_KEY='abc'\"'\"'def'"
    );
  });

  test('renderShellTemplate fails when the template uses unsupported sections', () => {
    expect(renderShellTemplate('{{#xai}}value{{/xai}}', { xai: 'value' })).toFail();
  });
});
