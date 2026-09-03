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

  describe('escape option', () => {
    const dangerous = { value: '<a href="x&y">hi</a>' };

    test('defaults to HTML escape (back-compat)', () => {
      const template = MustacheTemplate.create('{{value}}').orThrow();
      expect(template.options.escape).toBe('html');
      expect(template.render(dangerous)).toSucceedWith(
        '&lt;a href&#x3D;&quot;x&amp;y&quot;&gt;hi&lt;&#x2F;a&gt;'
      );
    });

    test('explicit html strategy matches default', () => {
      const template = MustacheTemplate.create('{{value}}', { escape: 'html' }).orThrow();
      expect(template.render(dangerous)).toSucceedWith(
        '&lt;a href&#x3D;&quot;x&amp;y&quot;&gt;hi&lt;&#x2F;a&gt;'
      );
    });

    test('"none" strategy renders the value verbatim', () => {
      const template = MustacheTemplate.create('{{value}}', { escape: 'none' }).orThrow();
      expect(template.options.escape).toBe('none');
      expect(template.render(dangerous)).toSucceedWith('<a href="x&y">hi</a>');
    });

    test('"none" coerces non-string values via String()', () => {
      const template = MustacheTemplate.create('{{value}}', { escape: 'none' }).orThrow();
      expect(template.render({ value: 42 })).toSucceedWith('42');
      expect(template.render({ value: true })).toSucceedWith('true');
    });

    test('custom escape function is applied to double-brace tokens', () => {
      const template = MustacheTemplate.create('{{value}}', {
        escape: (raw) => `[${raw.toUpperCase()}]`
      }).orThrow();
      expect(template.render({ value: 'abc' })).toSucceedWith('[ABC]');
    });

    test('triple-brace tokens are always unescaped regardless of strategy', () => {
      const html = MustacheTemplate.create('{{{value}}}', { escape: 'html' }).orThrow();
      expect(html.render(dangerous)).toSucceedWith('<a href="x&y">hi</a>');

      const custom = MustacheTemplate.create('{{{value}}}', {
        escape: (raw) => `[${raw}]`
      }).orThrow();
      // Verbatim — the custom escape MUST be bypassed for triple-brace.
      expect(custom.render(dangerous)).toSucceedWith('<a href="x&y">hi</a>');
    });

    test('concurrent templates with different strategies do not interfere', () => {
      const escaped = MustacheTemplate.create('{{value}}', { escape: 'html' }).orThrow();
      const passthrough = MustacheTemplate.create('{{value}}', { escape: 'none' }).orThrow();
      expect(escaped.render({ value: '<x>' })).toSucceedWith('&lt;x&gt;');
      expect(passthrough.render({ value: '<x>' })).toSucceedWith('<x>');
      expect(escaped.render({ value: '<y>' })).toSucceedWith('&lt;y&gt;');
    });

    test('escape strategy participates in validateAndRender', () => {
      const template = MustacheTemplate.create('{{value}}', { escape: 'none' }).orThrow();
      expect(template.validateAndRender({ value: '<safe>' })).toSucceedWith('<safe>');
    });
  });

  describe('renderWithSegments', () => {
    const segmentsOf = (tpl: string, ctx: unknown): ReadonlyArray<Mustache.IRenderedSegment> =>
      MustacheTemplate.create(tpl).orThrow().renderWithSegments(ctx).orThrow().segments;

    // The property the whole surface rests on. Asserted for every shape below rather than once,
    // because a segment map that does not reproduce its own text is worse than no map at all.
    const expectGapless = (tpl: string, ctx: unknown): void => {
      const rendered = MustacheTemplate.create(tpl).orThrow().renderWithSegments(ctx).orThrow();
      const joined = rendered.segments
        .map((seg) => rendered.text.slice(seg.start, seg.start + seg.length))
        .join('');
      expect(joined).toBe(rendered.text);
      expect(rendered.text).toBe(MustacheTemplate.create(tpl).orThrow().render(ctx).orThrow());
    };

    test('attributes literal text and substitutions in document order', () => {
      expect(segmentsOf('A {{v}} B', { v: 'XX' })).toEqual([
        { kind: 'literal', start: 0, length: 2, escaped: false },
        { kind: 'substitution', name: 'v', start: 2, length: 2, escaped: true },
        { kind: 'literal', start: 4, length: 2, escaped: false }
      ]);
      expectGapless('A {{v}} B', { v: 'XX' });
    });

    // ---- the four cases that defeat recovering offsets by searching the output ----------------

    test('a variable used twice gets distinct offsets', () => {
      // `indexOf` would report the first occurrence for both.
      const segs = segmentsOf('A {{v}} B {{v}} C', { v: 'ZZ' });
      const subs = segs.filter((s) => s.kind === 'substitution');
      expect(subs.map((s) => s.start)).toEqual([2, 7]);
      expectGapless('A {{v}} B {{v}} C', { v: 'ZZ' });
    });

    test('a value that is also a substring of the literal text is located correctly', () => {
      // `indexOf('the')` in "the the the" would report 0; the substitution is at 4.
      const subs = segmentsOf('the {{w}} the', { w: 'the' }).filter((s) => s.kind === 'substitution');
      expect(subs).toEqual([{ kind: 'substitution', name: 'w', start: 4, length: 3, escaped: true }]);
      expectGapless('the {{w}} the', { w: 'the' });
    });

    test('a variable that renders empty is still present, with zero length', () => {
      // There is nothing to search for, so recovery cannot represent this at all.
      expect(segmentsOf('X{{gone}}Y', { gone: '' })).toEqual([
        { kind: 'literal', start: 0, length: 1, escaped: false },
        { kind: 'substitution', name: 'gone', start: 1, length: 0, escaped: true },
        { kind: 'literal', start: 1, length: 1, escaped: false }
      ]);
      expectGapless('X{{gone}}Y', { gone: '' });
    });

    test('escaping changes the rendered length, and the segment reports the rendered one', () => {
      // The input value appears nowhere in the escaped output, so searching for it finds nothing.
      const subs = segmentsOf('{{h}} vs {{{h}}}', { h: '<b>&</b>' }).filter((s) => s.kind === 'substitution');
      expect(subs.map((s) => ({ escaped: s.escaped, length: s.length }))).toEqual([
        { escaped: true, length: 29 },
        { escaped: false, length: 8 }
      ]);
      expectGapless('{{h}} vs {{{h}}}', { h: '<b>&</b>' });
    });

    // ---- refusals, and what is simply skipped ------------------------------------------------

    test.each([
      ['a section', 'X{{#s}}in{{/s}}Y', /does not support '#' tokens/],
      ['an inverted section', 'X{{^s}}in{{/s}}Y', /does not support '\^' tokens/],
      ['a partial', 'X{{>p}}Y', /does not support '>' tokens/]
    ])('refuses %s rather than approximating it', (__desc, tpl, expected) => {
      expect(MustacheTemplate.create(tpl).orThrow().renderWithSegments({ s: true })).toFailWith(expected);
    });

    test('comments emit nothing and are skipped', () => {
      expectGapless('A{{! note }}B', {});
      expect(segmentsOf('A{{! note }}B', {}).filter((s) => s.kind === 'substitution')).toHaveLength(0);
    });

    test('a set-delimiter tag emits nothing and is skipped', () => {
      expectGapless('A{{=<% %>=}}B', {});
      expect(segmentsOf('A{{=<% %>=}}B', {}).filter((s) => s.kind === 'substitution')).toHaveLength(0);
    });

    test('interpolating after a set-delimiter tag works, and is attributed', () => {
      // Delimiters are a parse-time concern: each interpolation is rendered from its already-
      // parsed token, so what the delimiters were is invisible here. An earlier implementation
      // re-parsed a slice of the raw template with the DEFAULT delimiters and produced
      // `A<%v%>B` — the identity check refused it, and this is the fix rather than the refusal.
      const template = MustacheTemplate.create('A{{=<% %>=}}<%v%>B').orThrow();
      expect(template.render({ v: 'X' })).toSucceedWith('AXB');
      expect(template.renderWithSegments({ v: 'X' })).toSucceedAndSatisfy((r) => {
        expect(r.text).toBe('AXB');
        expect(r.segments).toEqual([
          { kind: 'literal', start: 0, length: 1, escaped: false },
          { kind: 'substitution', name: 'v', start: 1, length: 1, escaped: true },
          { kind: 'literal', start: 2, length: 1, escaped: false }
        ]);
      });
      expectGapless('A{{=<% %>=}}<%v%>B', { v: 'X' });
    });

    test('a delimiter change mid-template applies to what follows it and not to what precedes', () => {
      // The stronger form of the case above: both spellings appear in one template, and only the
      // one matching the delimiters in force at its position is a token at all.
      expectGapless('{{a}}{{=[ ]=}}[b] {{c}}', { a: 'A', b: 'B', c: 'C' });
      const subs = segmentsOf('{{a}}{{=[ ]=}}[b] {{c}}', { a: 'A', b: 'B', c: 'C' }).filter(
        (s) => s.kind === 'substitution'
      );
      expect(subs.map((s) => s.name)).toEqual(['a', 'b']);
    });

    test('evaluates each context value exactly once, as render() does', () => {
      // Not a micro-optimisation: an earlier version re-rendered the whole template to check its
      // own output against render(), which invoked every lambda a SECOND time. A caller cannot be
      // asked to make its context idempotent to use a diagnostic.
      const template = MustacheTemplate.create('{{f}}').orThrow();
      const countInvocations = (run: (ctx: { f: () => string }) => void): number => {
        let calls = 0;
        run({
          f: (): string => {
            calls += 1;
            return 'v';
          }
        });
        return calls;
      };
      const viaRender = countInvocations((ctx) => {
        template.render(ctx).orThrow();
      });
      const viaSegments = countInvocations((ctx) => {
        template.renderWithSegments(ctx).orThrow();
      });
      expect(viaRender).toBe(1);
      expect(viaSegments).toBe(viaRender);
    });

    test('a lambda that answers differently per call is rendered, not rejected', () => {
      // The guarantee is that `segments` describes `text` — not that `text` is reproducible. The
      // earlier self-check conflated the two and failed this template, which render() handles.
      let n = 0;
      const rendered = MustacheTemplate.create('x{{c}}y')
        .orThrow()
        .renderWithSegments({ c: (): string => String((n += 1)) });
      expect(rendered).toSucceedAndSatisfy((r) => {
        expect(r.text).toBe('x1y');
        const joined = r.segments.map((seg) => r.text.slice(seg.start, seg.start + seg.length)).join('');
        expect(joined).toBe(r.text);
      });
    });

    test('value semantics are mustache.js’s, not a reimplementation', () => {
      // The interpolation path delegates to the Writer primitives render() reaches through
      // renderTokens, so these all agree with render() by construction rather than by care.
      expectGapless('{{n}}', { n: 42 });
      expectGapless('{{f}}', { f: (): string => 'called' });
      expectGapless('{{nul}}', { nul: null });
      expectGapless('{{arr}}', { arr: [1, 2] });
      expect(segmentsOf('{{nul}}', { nul: null })[0].length).toBe(0);
      expect(segmentsOf('{{n}}', { n: 42 })[0].length).toBe(2);
    });

    test('an empty template yields no segments and empty text', () => {
      const r = MustacheTemplate.create('').orThrow().renderWithSegments({}).orThrow();
      expect(r).toEqual({ text: '', segments: [] });
    });

    test('a missing variable renders empty rather than failing, and is still attributed', () => {
      const subs = segmentsOf('a{{nope}}b', {}).filter((s) => s.kind === 'substitution');
      expect(subs).toEqual([{ kind: 'substitution', name: 'nope', start: 1, length: 0, escaped: true }]);
    });

    test('dotted paths resolve the same way render does', () => {
      expectGapless('{{a.b}}', { a: { b: 'deep' } });
      const subs = segmentsOf('{{a.b}}', { a: { b: 'deep' } });
      expect(subs).toEqual([{ kind: 'substitution', name: 'a.b', start: 0, length: 4, escaped: true }]);
    });
  });
});
