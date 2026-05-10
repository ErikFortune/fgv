import { Mustache } from '@fgv/ts-extras';
import { Result, fail, succeed } from '@fgv/ts-utils';

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
      if (!Object.prototype.hasOwnProperty.call(context, variable)) {
        return fail(`Missing template variable '${variable}'`);
      }
    }

    let rendered = template;
    for (const variable of variables) {
      // Variable names come from the Mustache parser and are regex-escaped before use.
      // eslint-disable-next-line @rushstack/security/no-unsafe-regexp -- safe: parser-validated, regex-escaped names
      const pattern = new RegExp(
        `\\{\\{\\{?\\s*&?\\s*${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}?\\}\\}`,
        'g'
      );
      rendered = rendered.replace(pattern, () => shellEscape(context[variable]));
    }
    return succeed(rendered);
  });
}

export function shellQuote(value: string): string {
  return shellEscape(value);
}
