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

import '@fgv/ts-utils-jest';

import {
  BaseMoldId,
  Measurement,
  Millimeters,
  MoldFormat,
  MoldId,
  Model as CommonModel,
  NoteCategory,
  UrlCategory
} from '../../../../packlets/common';
import { Molds, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditedMold } from '../../../../packlets/library-runtime/edited/moldWrapper';

// ============================================================================
// Test Helpers
// ============================================================================

function mm(n: number): Millimeters {
  return n as Millimeters;
}

// ============================================================================
// Test Data
// ============================================================================

const gridCavities: Molds.ICavities = {
  kind: 'grid',
  columns: 4,
  rows: 6,
  info: {
    weight: 10 as Measurement,
    dimensions: { width: mm(25), length: mm(25), depth: mm(15) }
  }
};

const countCavities: Molds.ICavities = {
  kind: 'count',
  count: 24,
  info: {
    weight: 12 as Measurement,
    dimensions: { width: mm(30), length: mm(30), depth: mm(20) }
  }
};

const baseMold: Molds.IMoldEntity = {
  baseId: 'cw1000' as BaseMoldId,
  manufacturer: 'Chocolate World',
  productNumber: 'CW1000',
  cavities: gridCavities,
  format: 'series-1000' as MoldFormat
};

const fullMold: Molds.IMoldEntity = {
  ...baseMold,
  description: 'Standard praline mold',
  tags: ['praline', 'standard'],
  related: ['cw1001' as MoldId, 'cw1002' as MoldId],
  notes: [{ note: 'Popular mold', category: 'general' as NoteCategory }],
  urls: [{ url: 'https://example.com/cw1000', category: 'product' as UrlCategory }]
};

// ============================================================================
// EditedMold Tests
// ============================================================================

describe('EditedMold', () => {
  describe('factory methods', () => {
    test('create() succeeds with base mold', () => {
      expect(EditedMold.create(baseMold)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.manufacturer).toBe('Chocolate World');
        expect(wrapper.productNumber).toBe('CW1000');
        expect(wrapper.format).toBe('series-1000');
      });
    });

    test('create() succeeds with full mold', () => {
      expect(EditedMold.create(fullMold)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.manufacturer).toBe('Chocolate World');
        expect(wrapper.current.description).toBe('Standard praline mold');
        expect(wrapper.current.tags).toEqual(['praline', 'standard']);
      });
    });

    test('create() deep copies the initial entity', () => {
      const mutableTags = ['praline'];
      const mold: Molds.IMoldEntity = {
        ...baseMold,
        tags: mutableTags
      };

      const wrapper = EditedMold.create(mold).orThrow();
      mutableTags.push('new-tag');

      expect(wrapper.current.tags).toHaveLength(1);
    });

    test('create() deep copies cavities', () => {
      const wrapper = EditedMold.create(fullMold).orThrow();
      const current = wrapper.current;

      expect(current.cavities).not.toBe(fullMold.cavities);
      if (current.cavities.kind === 'grid' && fullMold.cavities.kind === 'grid') {
        expect(current.cavities.info).not.toBe(fullMold.cavities.info);
      }
    });

    test('restoreFromHistory() restores with undo/redo stacks', () => {
      const history: Session.ISerializedEditingHistoryEntity<Molds.IMoldEntity> = {
        current: baseMold,
        original: baseMold,
        undoStack: [{ ...baseMold, manufacturer: 'Previous Manufacturer' }],
        redoStack: [{ ...baseMold, manufacturer: 'Future Manufacturer' }]
      };

      expect(EditedMold.restoreFromHistory(history)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.canUndo()).toBe(true);
        expect(wrapper.canRedo()).toBe(true);
        expect(wrapper.manufacturer).toBe('Chocolate World');
      });
    });
  });

  describe('snapshot management', () => {
    test('createSnapshot() returns deep copy', () => {
      const wrapper = EditedMold.create(fullMold).orThrow();
      const snapshot = wrapper.createSnapshot();

      expect(snapshot).toEqual(fullMold);

      wrapper.setManufacturer('Modified').orThrow();
      expect(snapshot.manufacturer).toBe('Chocolate World');
      expect(wrapper.manufacturer).toBe('Modified');
    });

    test('snapshot getter returns deep copy', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const snap = wrapper.snapshot;

      expect(snap).toEqual(baseMold);
      expect(snap).not.toBe(wrapper.current);
    });

    test('restoreSnapshot() restores state, pushes undo, clears redo', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      wrapper.setManufacturer('Change 1').orThrow();
      wrapper.setManufacturer('Change 2').orThrow();

      const snapshot = wrapper.createSnapshot();

      wrapper.setManufacturer('Change 3').orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setManufacturer('Change 4').orThrow();

      expect(wrapper.restoreSnapshot(snapshot)).toSucceed();
      expect(wrapper.manufacturer).toBe('Change 2');
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);
    });

    test('getSerializedHistory() returns complete history', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      wrapper.setManufacturer('Change 1').orThrow();
      wrapper.setManufacturer('Change 2').orThrow();
      wrapper.undo().orThrow();

      const history = wrapper.getSerializedHistory(baseMold);

      expect(history.current.manufacturer).toBe('Change 1');
      expect(history.original.manufacturer).toBe('Chocolate World');
      expect(history.undoStack).toHaveLength(1);
      expect(history.redoStack).toHaveLength(1);
      expect(history.undoStack[0].manufacturer).toBe('Chocolate World');
      expect(history.redoStack[0].manufacturer).toBe('Change 2');
    });

    test('getSerializedHistory() deep copies all states', () => {
      const wrapper = EditedMold.create(fullMold).orThrow();
      wrapper.setManufacturer('Changed').orThrow();

      const history = wrapper.getSerializedHistory(fullMold);

      wrapper.setManufacturer('Changed Again').orThrow();

      expect(history.current.manufacturer).toBe('Changed');
    });
  });

  describe('undo/redo', () => {
    test('undo() returns false when no history', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      expect(wrapper.undo()).toSucceedWith(false);
    });

    test('undo() after a change restores previous state', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      wrapper.setManufacturer('New Manufacturer').orThrow();
      expect(wrapper.manufacturer).toBe('New Manufacturer');

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.manufacturer).toBe('Chocolate World');
    });

    test('redo() returns false when no redo history', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      expect(wrapper.redo()).toSucceedWith(false);
    });

    test('redo() after undo restores undone state', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      wrapper.setManufacturer('New Manufacturer').orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.manufacturer).toBe('New Manufacturer');
    });

    test('canUndo() and canRedo() reflect correct states', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.canUndo()).toBe(false);
      expect(wrapper.canRedo()).toBe(false);

      wrapper.setManufacturer('Change').orThrow();
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);

      wrapper.undo().orThrow();
      expect(wrapper.canUndo()).toBe(false);
      expect(wrapper.canRedo()).toBe(true);
    });

    test('new edit clears redo stack', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      wrapper.setManufacturer('Change 1').orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setManufacturer('Change 2').orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });

    test('history truncation after MAX_HISTORY_SIZE changes', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      for (let i = 0; i < 51; i++) {
        wrapper.setManufacturer(`Manufacturer ${i}`).orThrow();
      }

      let undoCount = 0;
      while (wrapper.undo().orThrow()) {
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });

  describe('editing methods', () => {
    test('setManufacturer() updates manufacturer', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.setManufacturer('New Manufacturer')).toSucceed();
      expect(wrapper.manufacturer).toBe('New Manufacturer');
      expect(wrapper.canUndo()).toBe(true);
    });

    test('setProductNumber() updates product number', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.setProductNumber('CW2000')).toSucceed();
      expect(wrapper.productNumber).toBe('CW2000');
      expect(wrapper.canUndo()).toBe(true);
    });

    test('setDescription() sets and clears description', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.setDescription('A description')).toSucceed();
      expect(wrapper.current.description).toBe('A description');

      expect(wrapper.setDescription(undefined)).toSucceed();
      expect(wrapper.current.description).toBeUndefined();
    });

    test('setCavities() updates cavities with grid', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const newCavities: Molds.ICavities = {
        kind: 'grid',
        columns: 5,
        rows: 8,
        info: { weight: 15 as Measurement }
      };

      expect(wrapper.setCavities(newCavities)).toSucceed();
      expect(wrapper.current.cavities.kind).toBe('grid');
      if (wrapper.current.cavities.kind === 'grid') {
        expect(wrapper.current.cavities.columns).toBe(5);
        expect(wrapper.current.cavities.rows).toBe(8);
      }
      expect(wrapper.canUndo()).toBe(true);
    });

    test('setCavities() updates cavities with count', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.setCavities(countCavities)).toSucceed();
      expect(wrapper.current.cavities.kind).toBe('count');
      if (wrapper.current.cavities.kind === 'count') {
        expect(wrapper.current.cavities.count).toBe(24);
      }
    });

    test('setCavities() deep copies the cavities', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const cavities: Molds.ICavities = {
        kind: 'grid',
        columns: 3,
        rows: 4,
        info: { weight: 10 as Measurement, dimensions: { width: mm(20), length: mm(20), depth: mm(10) } }
      };

      wrapper.setCavities(cavities).orThrow();

      expect(wrapper.current.cavities).not.toBe(cavities);
      if (wrapper.current.cavities.kind === 'grid' && cavities.kind === 'grid') {
        expect(wrapper.current.cavities.info).not.toBe(cavities.info);
      }
    });

    test('setFormat() updates format', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.setFormat('series-2000' as MoldFormat)).toSucceed();
      expect(wrapper.format).toBe('series-2000');
      expect(wrapper.canUndo()).toBe(true);
    });

    test('setTags() sets and clears tags', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.setTags(['premium', 'new'])).toSucceed();
      expect(wrapper.current.tags).toEqual(['premium', 'new']);

      expect(wrapper.setTags(undefined)).toSucceed();
      expect(wrapper.current.tags).toBeUndefined();
    });

    test('setTags() deep copies the array', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const tags = ['tag1'];

      wrapper.setTags(tags).orThrow();
      tags.push('tag2');

      expect(wrapper.current.tags).toHaveLength(1);
    });

    test('setRelated() sets and clears related molds', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.setRelated(['cw2000' as MoldId, 'cw3000' as MoldId])).toSucceed();
      expect(wrapper.current.related).toEqual(['cw2000', 'cw3000']);

      expect(wrapper.setRelated(undefined)).toSucceed();
      expect(wrapper.current.related).toBeUndefined();
    });

    test('setRelated() deep copies the array', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const related: MoldId[] = ['cw2000' as MoldId];

      wrapper.setRelated(related).orThrow();
      related.push('cw3000' as MoldId);

      expect(wrapper.current.related).toHaveLength(1);
    });

    test('setNotes() sets and clears notes', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const notes: CommonModel.ICategorizedNote[] = [
        { note: 'Test note', category: 'general' as NoteCategory }
      ];

      expect(wrapper.setNotes(notes)).toSucceed();
      expect(wrapper.current.notes).toHaveLength(1);
      expect(wrapper.current.notes![0].note).toBe('Test note');

      expect(wrapper.setNotes(undefined)).toSucceed();
      expect(wrapper.current.notes).toBeUndefined();
    });

    test('setNotes() deep copies the array', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const notes: CommonModel.ICategorizedNote[] = [{ note: 'Note 1', category: 'general' as NoteCategory }];

      wrapper.setNotes(notes).orThrow();
      notes.push({ note: 'Note 2', category: 'general' as NoteCategory });

      expect(wrapper.current.notes).toHaveLength(1);
    });

    test('setUrls() sets and clears urls', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const urls: CommonModel.ICategorizedUrl[] = [
        { url: 'https://example.com', category: 'product' as UrlCategory }
      ];

      expect(wrapper.setUrls(urls)).toSucceed();
      expect(wrapper.current.urls).toHaveLength(1);
      expect(wrapper.current.urls![0].url).toBe('https://example.com');

      expect(wrapper.setUrls(undefined)).toSucceed();
      expect(wrapper.current.urls).toBeUndefined();
    });

    test('setUrls() deep copies the array', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const urls: CommonModel.ICategorizedUrl[] = [
        { url: 'https://example.com', category: 'product' as UrlCategory }
      ];

      wrapper.setUrls(urls).orThrow();
      urls.push({ url: 'https://other.com', category: 'manufacturer' as UrlCategory });

      expect(wrapper.current.urls).toHaveLength(1);
    });

    test('applyUpdate() applies partial update', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();

      expect(wrapper.applyUpdate({ manufacturer: 'Updated', description: 'New desc' })).toSucceed();
      expect(wrapper.manufacturer).toBe('Updated');
      expect(wrapper.current.description).toBe('New desc');
      expect(wrapper.canUndo()).toBe(true);
    });
  });

  describe('read-only access', () => {
    test('current returns the current entity', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      expect(wrapper.current.baseId).toBe('cw1000');
      expect(wrapper.current.manufacturer).toBe('Chocolate World');
    });

    test('manufacturer returns current manufacturer', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      expect(wrapper.manufacturer).toBe('Chocolate World');
    });

    test('productNumber returns current product number', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      expect(wrapper.productNumber).toBe('CW1000');
    });

    test('format returns current format', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      expect(wrapper.format).toBe('series-1000');
    });
  });

  describe('comparison', () => {
    test('hasChanges() returns false for unchanged entity', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      expect(wrapper.hasChanges(baseMold)).toBe(false);
    });

    test('hasChanges() returns true after manufacturer change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setManufacturer('Changed').orThrow();
      expect(wrapper.hasChanges(baseMold)).toBe(true);
    });

    test('getChanges() returns all-false for unchanged entity', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.hasChanges).toBe(false);
      expect(changes.manufacturerChanged).toBe(false);
      expect(changes.productNumberChanged).toBe(false);
      expect(changes.descriptionChanged).toBe(false);
      expect(changes.cavitiesChanged).toBe(false);
      expect(changes.formatChanged).toBe(false);
      expect(changes.tagsChanged).toBe(false);
      expect(changes.relatedChanged).toBe(false);
      expect(changes.notesChanged).toBe(false);
      expect(changes.urlsChanged).toBe(false);
    });

    test('getChanges() detects manufacturer change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setManufacturer('Changed').orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.manufacturerChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
      expect(changes.productNumberChanged).toBe(false);
    });

    test('getChanges() detects product number change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setProductNumber('CW9999').orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.productNumberChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects description change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setDescription('New description').orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.descriptionChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects cavities change — kind change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setCavities(countCavities).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects cavities change — grid dimensions', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 5,
          rows: 6,
          info: gridCavities.info
        })
        .orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() detects cavities change — grid rows', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 7,
          info: gridCavities.info
        })
        .orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() detects cavities change — count value', () => {
      const moldWithCount: Molds.IMoldEntity = { ...baseMold, cavities: countCavities };
      const wrapper = EditedMold.create(moldWithCount).orThrow();
      wrapper.setCavities({ kind: 'count', count: 30, info: countCavities.info }).orThrow();
      const changes = wrapper.getChanges(moldWithCount);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() no change when cavities are equal', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setCavities({ ...gridCavities }).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(false);
    });

    test('getChanges() no change when count cavities are equal', () => {
      const moldWithCount: Molds.IMoldEntity = { ...baseMold, cavities: countCavities };
      const wrapper = EditedMold.create(moldWithCount).orThrow();
      wrapper.setCavities({ ...countCavities }).orThrow();
      const changes = wrapper.getChanges(moldWithCount);

      expect(changes.cavitiesChanged).toBe(false);
    });

    test('getChanges() detects cavities change — cavity info weight', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { weight: 20 as Measurement, dimensions: { width: mm(25), length: mm(25), depth: mm(15) } }
        })
        .orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() detects cavities change — cavity info dimensions', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { weight: 10 as Measurement, dimensions: { width: mm(30), length: mm(25), depth: mm(15) } }
        })
        .orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() detects cavities change — info present vs absent', () => {
      const moldNoInfo: Molds.IMoldEntity = {
        ...baseMold,
        cavities: { kind: 'grid', columns: 4, rows: 6 }
      };
      const wrapper = EditedMold.create(moldNoInfo).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { weight: 10 as Measurement }
        })
        .orThrow();
      const changes = wrapper.getChanges(moldNoInfo);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() no change when cavities are equal', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setCavities({ ...gridCavities }).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(false);
    });

    test('getChanges() detects format change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setFormat('series-2000' as MoldFormat).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.formatChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects tags change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setTags(['new-tag']).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.tagsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects tags change — undefined to defined', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setTags(['tag1']).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.tagsChanged).toBe(true);
    });

    test('getChanges() detects tags change — different length', () => {
      const wrapper = EditedMold.create(fullMold).orThrow();
      wrapper.setTags(['praline']).orThrow();
      const changes = wrapper.getChanges(fullMold);

      expect(changes.tagsChanged).toBe(true);
    });

    test('getChanges() no change when tags are equal (different order)', () => {
      const wrapper = EditedMold.create(fullMold).orThrow();
      wrapper.setTags(['standard', 'praline']).orThrow();
      const changes = wrapper.getChanges(fullMold);

      expect(changes.tagsChanged).toBe(false);
    });

    test('getChanges() detects related change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setRelated(['cw5000' as MoldId]).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.relatedChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects notes change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setNotes([{ note: 'New note', category: 'general' as NoteCategory }]).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.notesChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() no change when notes are equal (different order)', () => {
      const moldWithNotes: Molds.IMoldEntity = {
        ...baseMold,
        notes: [
          { note: 'Note A', category: 'general' as NoteCategory },
          { note: 'Note B', category: 'production' as NoteCategory }
        ]
      };
      const wrapper = EditedMold.create(moldWithNotes).orThrow();
      wrapper
        .setNotes([
          { note: 'Note B', category: 'production' as NoteCategory },
          { note: 'Note A', category: 'general' as NoteCategory }
        ])
        .orThrow();
      const changes = wrapper.getChanges(moldWithNotes);

      expect(changes.notesChanged).toBe(false);
    });

    test('getChanges() detects notes change — different length', () => {
      const wrapper = EditedMold.create(fullMold).orThrow();
      wrapper
        .setNotes([
          { note: 'Popular mold', category: 'general' as NoteCategory },
          { note: 'Extra note', category: 'general' as NoteCategory }
        ])
        .orThrow();
      const changes = wrapper.getChanges(fullMold);

      expect(changes.notesChanged).toBe(true);
    });

    test('getChanges() detects urls change', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper.setUrls([{ url: 'https://new.com', category: 'product' as UrlCategory }]).orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.urlsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() no change when urls are equal (different order)', () => {
      const moldWithUrls: Molds.IMoldEntity = {
        ...baseMold,
        urls: [
          { url: 'https://a.com', category: 'product' as UrlCategory },
          { url: 'https://b.com', category: 'manufacturer' as UrlCategory }
        ]
      };
      const wrapper = EditedMold.create(moldWithUrls).orThrow();
      wrapper
        .setUrls([
          { url: 'https://b.com', category: 'manufacturer' as UrlCategory },
          { url: 'https://a.com', category: 'product' as UrlCategory }
        ])
        .orThrow();
      const changes = wrapper.getChanges(moldWithUrls);

      expect(changes.urlsChanged).toBe(false);
    });

    test('getChanges() detects urls change — different length', () => {
      const wrapper = EditedMold.create(fullMold).orThrow();
      wrapper
        .setUrls([
          { url: 'https://example.com/cw1000', category: 'product' as UrlCategory },
          { url: 'https://other.com', category: 'manufacturer' as UrlCategory }
        ])
        .orThrow();
      const changes = wrapper.getChanges(fullMold);

      expect(changes.urlsChanged).toBe(true);
    });

    test('getChanges() detects dimensions change — length', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { weight: 10 as Measurement, dimensions: { width: mm(25), length: mm(30), depth: mm(15) } }
        })
        .orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() detects dimensions change — depth', () => {
      const wrapper = EditedMold.create(baseMold).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { weight: 10 as Measurement, dimensions: { width: mm(25), length: mm(25), depth: mm(20) } }
        })
        .orThrow();
      const changes = wrapper.getChanges(baseMold);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() detects dimensions present vs absent', () => {
      const moldNoDims: Molds.IMoldEntity = {
        ...baseMold,
        cavities: { kind: 'grid', columns: 4, rows: 6, info: { weight: 10 as Measurement } }
      };
      const wrapper = EditedMold.create(moldNoDims).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { weight: 10 as Measurement, dimensions: { width: mm(25), length: mm(25), depth: mm(15) } }
        })
        .orThrow();
      const changes = wrapper.getChanges(moldNoDims);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('getChanges() no change when both infos are undefined', () => {
      const moldNoInfo: Molds.IMoldEntity = {
        ...baseMold,
        cavities: { kind: 'grid', columns: 4, rows: 6 }
      };
      const wrapper = EditedMold.create(moldNoInfo).orThrow();
      wrapper.setCavities({ kind: 'grid', columns: 4, rows: 6 }).orThrow();
      const changes = wrapper.getChanges(moldNoInfo);

      expect(changes.cavitiesChanged).toBe(false);
    });

    test('getChanges() no change when both dimensions are undefined', () => {
      const moldNoInfoDims: Molds.IMoldEntity = {
        ...baseMold,
        cavities: { kind: 'grid', columns: 4, rows: 6, info: { weight: 10 as Measurement } }
      };
      const wrapper = EditedMold.create(moldNoInfoDims).orThrow();
      wrapper
        .setCavities({ kind: 'grid', columns: 4, rows: 6, info: { weight: 10 as Measurement } })
        .orThrow();
      const changes = wrapper.getChanges(moldNoInfoDims);

      expect(changes.cavitiesChanged).toBe(false);
    });

    test('getChanges() no change when both weights are undefined', () => {
      const moldNoWeight: Molds.IMoldEntity = {
        ...baseMold,
        cavities: {
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { dimensions: { width: mm(25), length: mm(25), depth: mm(15) } }
        }
      };
      const wrapper = EditedMold.create(moldNoWeight).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { dimensions: { width: mm(25), length: mm(25), depth: mm(15) } }
        })
        .orThrow();
      const changes = wrapper.getChanges(moldNoWeight);

      expect(changes.cavitiesChanged).toBe(false);
    });

    test('getChanges() detects dimensions absent vs present', () => {
      const moldWithDims: Molds.IMoldEntity = {
        ...baseMold,
        cavities: {
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { weight: 10 as Measurement, dimensions: { width: mm(25), length: mm(25), depth: mm(15) } }
        }
      };
      const wrapper = EditedMold.create(moldWithDims).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { weight: 10 as Measurement }
        })
        .orThrow();
      const changes = wrapper.getChanges(moldWithDims);

      expect(changes.cavitiesChanged).toBe(true);
    });

    test('deep copy preserves count cavities without info', () => {
      const countNoInfo: Molds.ICavities = { kind: 'count', count: 12 };
      const moldCountNoInfo: Molds.IMoldEntity = { ...baseMold, cavities: countNoInfo };
      const wrapper = EditedMold.create(moldCountNoInfo).orThrow();

      expect(wrapper.current.cavities.kind).toBe('count');
      if (wrapper.current.cavities.kind === 'count') {
        expect(wrapper.current.cavities.info).toBeUndefined();
      }
    });

    test('deep copy preserves cavity info without dimensions', () => {
      const gridNoDims: Molds.ICavities = {
        kind: 'grid',
        columns: 4,
        rows: 6,
        info: { weight: 10 as Measurement }
      };
      const moldNoDims: Molds.IMoldEntity = { ...baseMold, cavities: gridNoDims };
      const wrapper = EditedMold.create(moldNoDims).orThrow();

      if (wrapper.current.cavities.kind === 'grid' && wrapper.current.cavities.info) {
        expect(wrapper.current.cavities.info.dimensions).toBeUndefined();
        expect(wrapper.current.cavities.info.weight).toBe(10);
      }
    });

    test('getChanges() detects weight present vs absent', () => {
      const moldNoWeight: Molds.IMoldEntity = {
        ...baseMold,
        cavities: {
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: { dimensions: { width: mm(25), length: mm(25), depth: mm(15) } }
        }
      };
      const wrapper = EditedMold.create(moldNoWeight).orThrow();
      wrapper
        .setCavities({
          kind: 'grid',
          columns: 4,
          rows: 6,
          info: {
            weight: 10 as Measurement,
            dimensions: { width: mm(25), length: mm(25), depth: mm(15) }
          }
        })
        .orThrow();
      const changes = wrapper.getChanges(moldNoWeight);

      expect(changes.cavitiesChanged).toBe(true);
    });
  });
});
