/*
 * Copyright (c) 2020 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';

import { Mustache } from '../..';
import { MustacheTemplate } from '../../packlets/mustache';

describe('MustacheTemplate', () => {
  describe('static create', () => {
    test('creates a template from a valid template string', () => {
      expect(MustacheTemplate.create('Hello {{name}}!')).toSucceedAndSatisfy((template) => {
        expect(template.template).toBe('Hello {{name}}!');
      });
    });

    test('creates a template from an empty string', () => {
      expect(MustacheTemplate.create('')).toSucceedAndSatisfy((template) => {
        expect(template.template).toBe('');
      });
    });

    test('creates a template from a string with no variables', () => {
      expect(MustacheTemplate.create('Hello World!')).toSucceedAndSatisfy((template) => {
        expect(template.template).toBe('Hello World!');
      });
    });

    test('fails for a template with unclosed section', () => {
      expect(MustacheTemplate.create('{{#items}}{{name}}')).toFail();
    });

    test('fails for a template with mismatched section tags', () => {
      expect(MustacheTemplate.create('{{#items}}{{name}}{{/other}}')).toFail();
    });

    test('accepts custom tags option', () => {
      expect(MustacheTemplate.create('Hello <% name %>!', { tags: ['<%', '%>'] })).toSucceedAndSatisfy(
        (template) => {
          expect(template.options.tags).toEqual(['<%', '%>']);
        }
      );
    });

    test('sets default options when none provided', () => {
      expect(MustacheTemplate.create('Hello {{name}}!')).toSucceedAndSatisfy((template) => {
        expect(template.options.tags).toEqual(['{{', '}}']);
        expect(template.options.includeComments).toBe(false);
        expect(template.options.includePartials).toBe(false);
      });
    });
  });

  describe('static validate', () => {
    test('returns success for a valid template', () => {
      expect(MustacheTemplate.validate('Hello {{name}}!')).toSucceedWith(true);
    });

    test('returns success for an empty template', () => {
      expect(MustacheTemplate.validate('')).toSucceedWith(true);
    });

    test('fails for an invalid template', () => {
      expect(MustacheTemplate.validate('{{#items}}{{name}}')).toFail();
    });

    test('validates with custom tags', () => {
      expect(MustacheTemplate.validate('Hello <% name %>!', { tags: ['<%', '%>'] })).toSucceedWith(true);
    });
  });

  describe('instance validate', () => {
    test('always returns success for a created template', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();
      expect(template.validate()).toSucceedWith(true);
    });
  });

  describe('extractVariables', () => {
    test('extracts simple variables', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(1);
      expect(variables[0]).toEqual({
        name: 'name',
        path: ['name'],
        tokenType: 'name',
        isSection: false
      });
    });

    test('extracts dot-path variables', () => {
      const template = MustacheTemplate.create('Hello {{user.profile.name}}!').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(1);
      expect(variables[0]).toEqual({
        name: 'user.profile.name',
        path: ['user', 'profile', 'name'],
        tokenType: 'name',
        isSection: false
      });
    });

    test('extracts unescaped variables with triple braces', () => {
      const template = MustacheTemplate.create('Hello {{{html}}}!').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(1);
      expect(variables[0]).toEqual({
        name: 'html',
        path: ['html'],
        tokenType: '&',
        isSection: false
      });
    });

    test('extracts unescaped variables with ampersand', () => {
      const template = MustacheTemplate.create('Hello {{& html}}!').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(1);
      expect(variables[0].tokenType).toBe('&');
    });

    test('extracts section variables', () => {
      const template = MustacheTemplate.create('{{#items}}{{name}}{{/items}}').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(2);
      expect(variables[0]).toEqual({
        name: 'items',
        path: ['items'],
        tokenType: '#',
        isSection: true
      });
      expect(variables[1]).toEqual({
        name: 'name',
        path: ['name'],
        tokenType: 'name',
        isSection: false
      });
    });

    test('extracts inverted section variables', () => {
      const template = MustacheTemplate.create('{{^empty}}Not empty{{/empty}}').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(1);
      expect(variables[0]).toEqual({
        name: 'empty',
        path: ['empty'],
        tokenType: '^',
        isSection: true
      });
    });

    test('extracts the special dot context variable', () => {
      const template = MustacheTemplate.create('{{#items}}{{.}}{{/items}}').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(2);
      expect(variables[1]).toEqual({
        name: '.',
        path: ['.'],
        tokenType: 'name',
        isSection: false
      });
    });

    test('extracts nested section variables', () => {
      const template = MustacheTemplate.create(
        '{{#users}}{{name}}{{#items}}{{title}}{{/items}}{{/users}}'
      ).orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(4);
      expect(variables.map((v) => v.name)).toEqual(['users', 'name', 'items', 'title']);
    });

    test('returns empty array for template with no variables', () => {
      const template = MustacheTemplate.create('Hello World!').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(0);
    });

    test('excludes comments by default', () => {
      const template = MustacheTemplate.create('{{! This is a comment }}Hello {{name}}!').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('name');
    });

    test('includes comments when option is set', () => {
      const template = MustacheTemplate.create('{{! This is a comment }}Hello {{name}}!', {
        includeComments: true
      }).orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(2);
      expect(variables[0].tokenType).toBe('!');
    });

    test('excludes partials by default', () => {
      const template = MustacheTemplate.create('{{> header}}Hello {{name}}!').orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('name');
    });

    test('includes partials when option is set', () => {
      const template = MustacheTemplate.create('{{> header}}Hello {{name}}!', {
        includePartials: true
      }).orThrow();
      const variables = template.extractVariables();

      expect(variables).toHaveLength(2);
      expect(variables[0].tokenType).toBe('>');
      expect(variables[0].name).toBe('header');
    });

    test('caches extracted variables', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();
      const first = template.extractVariables();
      const second = template.extractVariables();

      expect(first).toBe(second);
    });
  });

  describe('extractVariableNames', () => {
    test('extracts unique variable names', () => {
      const template = MustacheTemplate.create('{{name}} - {{name}} - {{other}}').orThrow();
      const names = template.extractVariableNames();

      expect(names).toEqual(['name', 'other']);
    });

    test('preserves order of first occurrence', () => {
      const template = MustacheTemplate.create('{{c}} {{a}} {{b}} {{a}}').orThrow();
      const names = template.extractVariableNames();

      expect(names).toEqual(['c', 'a', 'b']);
    });

    test('returns empty array for template with no variables', () => {
      const template = MustacheTemplate.create('Hello World!').orThrow();
      const names = template.extractVariableNames();

      expect(names).toHaveLength(0);
    });
  });

  describe('validateContext', () => {
    test('validates a complete context', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();

      expect(template.validateContext({ name: 'World' })).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(true);
        expect(result.presentVariables).toEqual(['name']);
        expect(result.missingVariables).toHaveLength(0);
      });
    });

    test('validates nested path variables', () => {
      const template = MustacheTemplate.create('Hello {{user.profile.name}}!').orThrow();

      expect(template.validateContext({ user: { profile: { name: 'Alice' } } })).toSucceedAndSatisfy(
        (result) => {
          expect(result.isValid).toBe(true);
          expect(result.presentVariables).toEqual(['user.profile.name']);
        }
      );
    });

    test('reports missing simple variables', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();

      expect(template.validateContext({})).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingVariables).toEqual(['name']);
        expect(result.missingDetails).toHaveLength(1);
        expect(result.missingDetails[0].failedAtSegment).toBe('name');
      });
    });

    test('reports missing nested path variables', () => {
      const template = MustacheTemplate.create('Hello {{user.profile.name}}!').orThrow();

      expect(template.validateContext({ user: {} })).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingVariables).toEqual(['user.profile.name']);
        expect(result.missingDetails[0].failedAtSegment).toBe('profile');
        expect(result.missingDetails[0].existingPath).toEqual(['user']);
      });
    });

    test('reports missing intermediate path segment', () => {
      const template = MustacheTemplate.create('Hello {{a.b.c.d}}!').orThrow();

      expect(template.validateContext({ a: { b: { wrong: 'value' } } })).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingDetails[0].failedAtSegment).toBe('c');
        expect(result.missingDetails[0].existingPath).toEqual(['a', 'b']);
      });
    });

    test('validates the special dot context', () => {
      const template = MustacheTemplate.create('{{.}}').orThrow();

      expect(template.validateContext('value')).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(true);
        expect(result.presentVariables).toEqual(['.']);
      });
    });

    test('reports missing dot context for null', () => {
      const template = MustacheTemplate.create('{{.}}').orThrow();

      expect(template.validateContext(null)).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingVariables).toEqual(['.']);
      });
    });

    test('reports missing dot context for undefined', () => {
      const template = MustacheTemplate.create('{{.}}').orThrow();

      expect(template.validateContext(undefined)).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingVariables).toEqual(['.']);
      });
    });

    test('validates multiple variables', () => {
      const template = MustacheTemplate.create('{{a}} {{b}} {{c}}').orThrow();

      expect(template.validateContext({ a: 1, b: 2 })).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.presentVariables).toEqual(['a', 'b']);
        expect(result.missingVariables).toEqual(['c']);
      });
    });

    test('handles non-object context for path lookup', () => {
      const template = MustacheTemplate.create('{{a.b}}').orThrow();

      expect(template.validateContext('string')).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingDetails[0].failedAtSegment).toBe('a');
      });
    });

    test('deduplicates repeated variables', () => {
      const template = MustacheTemplate.create('{{name}} {{name}} {{name}}').orThrow();

      expect(template.validateContext({ name: 'test' })).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(true);
        expect(result.presentVariables).toEqual(['name']);
      });
    });

    test('handles null intermediate path segment', () => {
      const template = MustacheTemplate.create('{{a.b}}').orThrow();

      expect(template.validateContext({ a: null })).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingDetails[0].failedAtSegment).toBe('b');
      });
    });
  });

  describe('render', () => {
    test('renders a simple template', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();

      expect(template.render({ name: 'World' })).toSucceedWith('Hello World!');
    });

    test('renders a template with nested paths', () => {
      const template = MustacheTemplate.create('Hello {{user.name}}!').orThrow();

      expect(template.render({ user: { name: 'Alice' } })).toSucceedWith('Hello Alice!');
    });

    test('renders a template with sections', () => {
      const template = MustacheTemplate.create('{{#items}}{{.}}, {{/items}}').orThrow();

      expect(template.render({ items: ['a', 'b', 'c'] })).toSucceedWith('a, b, c, ');
    });

    test('renders a template with inverted sections', () => {
      const template = MustacheTemplate.create('{{^empty}}Has content{{/empty}}').orThrow();

      expect(template.render({ empty: false })).toSucceedWith('Has content');
    });

    test('renders empty string for missing variables', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();

      expect(template.render({})).toSucceedWith('Hello !');
    });

    test('renders template with no variables', () => {
      const template = MustacheTemplate.create('Hello World!').orThrow();

      expect(template.render({})).toSucceedWith('Hello World!');
    });
  });

  describe('validateAndRender', () => {
    test('renders when context is valid', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();

      expect(template.validateAndRender({ name: 'World' })).toSucceedWith('Hello World!');
    });

    test('fails when context is missing variables', () => {
      const template = MustacheTemplate.create('Hello {{name}}!').orThrow();

      expect(template.validateAndRender({})).toFailWith(/missing required variables.*name/i);
    });

    test('fails with multiple missing variables listed', () => {
      const template = MustacheTemplate.create('{{a}} {{b}} {{c}}').orThrow();

      expect(template.validateAndRender({})).toFailWith(/missing required variables.*a.*b.*c/i);
    });

    test('validates nested paths before rendering', () => {
      const template = MustacheTemplate.create('Hello {{user.name}}!').orThrow();

      expect(template.validateAndRender({ user: {} })).toFailWith(/missing required variables/i);
    });

    test('renders successfully with valid nested paths', () => {
      const template = MustacheTemplate.create('Hello {{user.name}}!').orThrow();

      expect(template.validateAndRender({ user: { name: 'Alice' } })).toSucceedWith('Hello Alice!');
    });
  });

  describe('export from main package', () => {
    test('MustacheTemplate is accessible via Mustache namespace', () => {
      expect(Mustache.MustacheTemplate).toBe(MustacheTemplate);
    });

    test('can create template via namespace', () => {
      expect(Mustache.MustacheTemplate.create('Hello {{name}}!')).toSucceedAndSatisfy(
        (template: MustacheTemplate) => {
          expect(template.template).toBe('Hello {{name}}!');
        }
      );
    });
  });

  describe('edge cases', () => {
    test('handles empty path segments in variable names', () => {
      const template = MustacheTemplate.create('{{a..b}}').orThrow();
      const variables = template.extractVariables();

      // Empty segments are filtered out
      expect(variables[0].path).toEqual(['a', 'b']);
    });

    test('handles template with only whitespace variable names', () => {
      // Mustache allows whitespace in variable names
      const template = MustacheTemplate.create('{{ name }}').orThrow();
      const variables = template.extractVariables();

      // Mustache trims whitespace from variable names
      expect(variables[0].name).toBe('name');
    });

    test('handles complex nested template', () => {
      const complexTemplate = `
        {{#users}}
          Name: {{profile.name}}
          {{#posts}}
            Title: {{title}}
            {{#comments}}
              {{author}}: {{text}}
            {{/comments}}
          {{/posts}}
        {{/users}}
      `;
      const template = MustacheTemplate.create(complexTemplate).orThrow();
      const names = template.extractVariableNames();

      expect(names).toContain('users');
      expect(names).toContain('profile.name');
      expect(names).toContain('posts');
      expect(names).toContain('title');
      expect(names).toContain('comments');
      expect(names).toContain('author');
      expect(names).toContain('text');
    });

    test('validates complex nested context', () => {
      const template = MustacheTemplate.create('{{user.profile.settings.theme}}').orThrow();
      const context = {
        user: {
          profile: {
            settings: {
              theme: 'dark'
            }
          }
        }
      };

      expect(template.validateContext(context)).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(true);
      });
    });
  });
});
