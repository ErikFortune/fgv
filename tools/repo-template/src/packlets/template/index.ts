/**
 * Template rendering — simple variable substitution for .tmpl files.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ITemplateVars {
  REPO_URL: string;
  VERSION_POLICY_NAME: string;
  VERSION: string;
  [key: string]: string;
}

/**
 * Render a template string by replacing `{{VAR_NAME}}` placeholders.
 */
export function renderTemplate(template: string, vars: ITemplateVars): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Read a template file, render it with variables, and write to destination.
 */
export function renderTemplateFile(templatePath: string, destPath: string, vars: ITemplateVars): void {
  if (!fs.existsSync(templatePath)) {
    console.warn(`  WARNING: Template not found, skipping: ${templatePath}`);
    return;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const template = fs.readFileSync(templatePath, 'utf-8');
  const rendered = renderTemplate(template, vars);
  fs.writeFileSync(destPath, rendered);
  console.log(`  Generated: ${destPath}`);
}

/**
 * Resolve the default templates directory relative to this tool's location.
 */
export function getDefaultTemplatesDir(): string {
  const toolRoot = path.resolve(__dirname, '..', '..', '..');
  return path.join(toolRoot, 'templates');
}
