import { Mustache } from '@fgv/ts-extras';
import { Result, fail, succeed } from '@fgv/ts-utils';

// Mustache is used only for parsing/variable extraction. Rendering is done via regex
// because Mustache's renderer HTML-escapes output, but we need shell-quoting instead.
const TEMPLATE_VARIABLE_PATTERN: RegExp = /\{\{\{?\s*(?:&\s*)?([^{}&\s]+)\s*\}?\}\}/g;

function shellEscape(value: string): string {
  if (value.length === 0) {
    return "''";
  }

  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function isSupportedToken(tokenType: string): boolean {
  return tokenType === 'name' || tokenType === '&';
}

export function extractTemplateVariables(template: string): Result<readonly string[]> {
  return Mustache.MustacheTemplate.create(template).onSuccess((parsed) => {
    const variables = parsed.extractVariables();
    const unsupported = variables.find((variable) => !isSupportedToken(variable.tokenType));
    if (unsupported) {
      return fail(
        `Unsupported template token '${unsupported.tokenType}' for variable '${unsupported.name}'. ` +
          'Only simple variable substitutions are supported in v1.'
      );
    }

    return succeed(parsed.extractVariableNames());
  });
}

export function renderShellTemplate(
  template: string,
  context: Readonly<Record<string, string>>
): Result<string> {
  return extractTemplateVariables(template).onSuccess((variables) => {
    for (const variable of variables) {
      if (!(variable in context)) {
        return fail(`Missing template variable '${variable}'`);
      }
    }

    return succeed(
      template.replace(TEMPLATE_VARIABLE_PATTERN, (__: string, rawName: string) => {
        const name = rawName.trim();
        const value = context[name];
        if (value === undefined) {
          return '';
        }
        return shellEscape(value);
      })
    );
  });
}

export function shellQuote(value: string): string {
  return shellEscape(value);
}
