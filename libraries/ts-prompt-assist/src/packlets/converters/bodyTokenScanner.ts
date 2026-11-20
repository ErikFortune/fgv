/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { Mustache } from '@fgv/ts-extras';
import { PromptId } from '../types';

// Mustache.js's tokenizer collapses `{{&name}}` and `{{{name}}}` to the same
// `'&'` tokenType, so we cannot distinguish ampersand-unescape from triple-
// brace canonical form via parser metadata. To enforce author discipline per
// design §6.2 we pre-scan the raw body for the `{{&` literal sequence before
// invoking the mustache parser. Triple-brace `{{{` does NOT match this
// pattern. Escaped double-brace `{{name}}` is caught by the post-parse
// `tokenType === 'name'` check (parse output discriminates that form).
const AMPERSAND_UNESCAPE_RE: RegExp = /\{\{\s*&\s*([A-Za-z0-9_.]+)\s*\}\}/;

/**
 * Scans a candidate body for double-brace `\{\{name\}\}` and ampersand-unescape
 * `\{\{&name\}\}` Mustache tokens. The locked authoring rule (design §6) is
 * that LLM-prompt bodies use only triple-brace `\{\{\{name\}\}\}` tokens — the
 * library renders with `escape: 'none'`, so the double-brace and ampersand
 * forms semantically collapse with the triple-brace form but are rejected at
 * load time to keep author intent explicit.
 *
 * @param body - Candidate body to scan.
 * @param promptId - Prompt id for error context.
 * @param candidateIndex - Index into the record's candidates array, for error context.
 * @returns Success on a clean body; Failure with prompt-id and offending token in the message.
 * @public
 */
export function scanCandidateBody(body: string, promptId: PromptId, candidateIndex: number): Result<true> {
  const ampersandMatch = AMPERSAND_UNESCAPE_RE.exec(body);
  if (ampersandMatch !== null) {
    return fail(
      `prompt '${promptId}' candidate ${candidateIndex}: body uses token '{{&${ampersandMatch[1]}}}'; use triple-brace '{{{${ampersandMatch[1]}}}}'`
    );
  }
  return Mustache.MustacheTemplate.create(body, { escape: 'none' })
    .withErrorFormat(
      (msg) => `prompt '${promptId}' candidate ${candidateIndex}: mustache parse failed: ${msg}`
    )
    .onSuccess((template) => {
      const variables = template.extractVariables();
      for (const variable of variables) {
        if (variable.tokenType === 'name') {
          return fail(
            `prompt '${promptId}' candidate ${candidateIndex}: body uses token '{{${variable.name}}}'; use triple-brace '{{{${variable.name}}}}'`
          );
        }
      }
      return succeed(true as const);
    });
}
