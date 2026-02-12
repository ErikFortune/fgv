// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { ProcedureId } from '@fgv/ts-chocolate';
import '@fgv/ts-utils-jest';

import {
  renderProcedureDetail,
  renderProcedureSummary
} from '../../../../../commands/workspace/renderers/procedureRenderer';
import { createTestLibrary } from './helpers/testLibrary';

describe('procedureRenderer', () => {
  const lib = createTestLibrary();
  const fullProcedure = lib.procedures.get('test.ganache-basic' as ProcedureId).orThrow();
  const minimalProcedure = lib.procedures.get('test.simple-mix' as ProcedureId).orThrow();

  describe('renderProcedureSummary', () => {
    test('formats procedure with category and total time', () => {
      const summary = renderProcedureSummary(fullProcedure);
      expect(summary).toContain('test.ganache-basic');
      expect(summary).toContain('Basic Ganache');
      expect(summary).toContain('[ganache]');
      expect(summary).toContain('2 steps');
      expect(summary).toContain('min total');
    });

    test('formats minimal procedure without category or time', () => {
      const summary = renderProcedureSummary(minimalProcedure);
      expect(summary).toContain('test.simple-mix');
      expect(summary).toContain('Simple Mix');
      expect(summary).not.toContain('[');
      expect(summary).toContain('1 steps');
      expect(summary).not.toContain('min total');
    });
  });

  describe('renderProcedureDetail - full procedure', () => {
    test('renders basic fields', () => {
      const result = renderProcedureDetail(fullProcedure);
      expect(result.text).toContain('Procedure: Basic Ganache');
      expect(result.text).toContain('ID: test.ganache-basic');
      expect(result.text).toContain('Category: ganache');
      expect(result.text).toContain('Description: Standard ganache procedure');
      expect(result.text).toContain('Tags: ganache, basic');
    });

    test('renders task ref step', () => {
      const result = renderProcedureDetail(fullProcedure);
      expect(result.text).toContain('Task: test.melt-chocolate');
      expect(result.text).toContain('1.');
    });

    test('renders inline task step', () => {
      const result = renderProcedureDetail(fullProcedure);
      expect(result.text).toContain('Mix ingredients together');
      expect(result.text).toContain('2.');
    });

    test('renders step timing details', () => {
      const result = renderProcedureDetail(fullProcedure);

      // Step 1: activeTime, temperature
      expect(result.text).toContain('active: 10min');
      expect(result.text).toContain('temp: 50°C');

      // Step 2: activeTime, waitTime, holdTime
      expect(result.text).toContain('active: 5min');
      expect(result.text).toContain('wait: 30min');
      expect(result.text).toContain('hold: 120min');
    });

    test('renders step notes', () => {
      const result = renderProcedureDetail(fullProcedure);
      // The notes field is an array, so it will render as array toString
      expect(result.text).toContain('Note:');
    });

    test('renders timing summary', () => {
      const result = renderProcedureDetail(fullProcedure);
      expect(result.text).toContain('Timing Summary:');
      expect(result.text).toContain('Active Time:');
      expect(result.text).toContain('Wait Time:');
      expect(result.text).toContain('Hold Time:');
      expect(result.text).toContain('Total Time:');
    });

    test('renders procedure notes', () => {
      const result = renderProcedureDetail(fullProcedure);
      expect(result.text).toContain('Notes:');
      expect(result.text).toContain('Allow to cool');
    });

    test('returns empty actions', () => {
      const result = renderProcedureDetail(fullProcedure);
      expect(result.actions).toEqual([]);
    });
  });

  describe('renderProcedureDetail - minimal procedure', () => {
    test('renders without category, description, tags, notes', () => {
      const result = renderProcedureDetail(minimalProcedure);
      expect(result.text).toContain('Procedure: Simple Mix');
      expect(result.text).toContain('ID: test.simple-mix');
      expect(result.text).not.toContain('Category:');
      expect(result.text).not.toContain('Description:');
      expect(result.text).not.toContain('Tags:');
    });

    test('renders inline task', () => {
      const result = renderProcedureDetail(minimalProcedure);
      expect(result.text).toContain('Mix everything');
      expect(result.text).toContain('1.');
    });

    test('no timing summary', () => {
      const result = renderProcedureDetail(minimalProcedure);
      expect(result.text).not.toContain('Timing Summary:');
    });

    test('returns empty actions', () => {
      const result = renderProcedureDetail(minimalProcedure);
      expect(result.actions).toEqual([]);
    });
  });
});
