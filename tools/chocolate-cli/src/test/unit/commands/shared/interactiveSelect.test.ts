// Copyright (c) 2026 Erik Fortune

jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

import '@fgv/ts-utils-jest';
import { search } from '@inquirer/prompts';
import {
  formatSelectableItem,
  type IInteractiveSelectConfig,
  type ISelectableItem,
  interactiveSelect
} from '../../../../commands/shared/interactiveSelect';

const mockSearch = search as jest.MockedFunction<typeof search>;

describe('interactiveSelect', () => {
  const testItems: ISelectableItem[] = [
    { id: 'item1', name: 'First Item', description: 'First description' },
    { id: 'item2', name: 'Second Item', description: 'Second description' },
    { id: 'item3', name: 'Third Item' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns failure for empty items list', async () => {
    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: [],
      prompt: 'Select an item'
    };

    expect(await interactiveSelect(config)).toFailWith(/no items available for selection/i);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  test('returns selected item on successful selection', async () => {
    mockSearch.mockResolvedValue('item2');

    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Select an item'
    };

    expect(await interactiveSelect(config)).toSucceedWith(testItems[1]);
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });

  test('returns cancelled when user cancels with ExitPromptError', async () => {
    const error = new Error('Cancelled');
    (error as { name: string }).name = 'ExitPromptError';
    mockSearch.mockRejectedValue(error);

    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Select an item'
    };

    expect(await interactiveSelect(config)).toSucceedWith('cancelled');
  });

  test('returns cancelled when user force closes', async () => {
    const forceCloseError = new Error('User force closed the prompt');
    mockSearch.mockRejectedValue(forceCloseError);

    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Select an item'
    };

    expect(await interactiveSelect(config)).toSucceedWith('cancelled');
  });

  test('returns failure for unexpected errors', async () => {
    const unexpectedError = new Error('Something went wrong');
    mockSearch.mockRejectedValue(unexpectedError);

    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Select an item'
    };

    expect(await interactiveSelect(config)).toFailWith(/something went wrong/i);
  });

  test('returns failure when selected ID not found in items', async () => {
    mockSearch.mockResolvedValue('nonexistent-id');

    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Select an item'
    };

    expect(await interactiveSelect(config)).toFailWith(/selected item not found.*nonexistent-id/i);
  });

  test('passes correct message and pageSize to search', async () => {
    mockSearch.mockResolvedValue('item1');

    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Choose your item'
    };

    await interactiveSelect(config);

    expect(mockSearch).toHaveBeenCalledWith({
      message: 'Choose your item (Esc to go back)',
      source: expect.any(Function),
      pageSize: 15
    });
  });

  test('search source filters by term case-insensitively', async () => {
    mockSearch.mockResolvedValue('item1');

    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Select an item'
    };

    await interactiveSelect(config);

    const searchCall = mockSearch.mock.calls[0][0];
    const sourceFunction = searchCall.source as (
      term: string | undefined
    ) => Promise<Array<{ name: string; value: string; description?: string }>>;

    // Test case-insensitive filtering on name
    const firstResults = await sourceFunction('FIRST');
    expect(firstResults).toEqual([
      { name: 'item1 - First description', value: 'item1', description: 'First Item' }
    ]);

    // Test filtering on description
    const secondResults = await sourceFunction('second desc');
    expect(secondResults).toEqual([
      { name: 'item2 - Second description', value: 'item2', description: 'Second Item' }
    ]);

    // Test filtering on id
    const thirdResults = await sourceFunction('item3');
    expect(thirdResults).toEqual([{ name: 'item3', value: 'item3', description: 'Third Item' }]);

    // Test no matches
    const noResults = await sourceFunction('nonexistent');
    expect(noResults).toEqual([]);
  });

  test('search source returns all items when no term provided', async () => {
    mockSearch.mockResolvedValue('item1');

    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Select an item'
    };

    await interactiveSelect(config);

    const searchCall = mockSearch.mock.calls[0][0];
    const sourceFunction = searchCall.source as (
      term: string | undefined
    ) => Promise<Array<{ name: string; value: string; description?: string }>>;

    const results = await sourceFunction(undefined);
    expect(results).toHaveLength(3);
    expect(results).toEqual([
      { name: 'item1 - First description', value: 'item1', description: 'First Item' },
      { name: 'item2 - Second description', value: 'item2', description: 'Second Item' },
      { name: 'item3', value: 'item3', description: 'Third Item' }
    ]);
  });

  test('uses custom formatName function', async () => {
    mockSearch.mockResolvedValue('item1');

    const customFormat = (item: ISelectableItem): string => `Custom: ${item.name}`;
    const config: IInteractiveSelectConfig<ISelectableItem> = {
      items: testItems,
      prompt: 'Select an item',
      formatName: customFormat
    };

    await interactiveSelect(config);

    const searchCall = mockSearch.mock.calls[0][0];
    const sourceFunction = searchCall.source as (
      term: string | undefined
    ) => Promise<Array<{ name: string; value: string; description?: string }>>;

    const results = await sourceFunction(undefined);
    expect(results).toEqual([
      { name: 'Custom: First Item', value: 'item1', description: 'First Item' },
      { name: 'Custom: Second Item', value: 'item2', description: 'Second Item' },
      { name: 'Custom: Third Item', value: 'item3', description: 'Third Item' }
    ]);
  });
});

describe('formatSelectableItem', () => {
  const testItem: ISelectableItem = {
    id: 'test-id',
    name: 'Test Item',
    description: 'Test description'
  };

  test('returns id only when no extra info provided', () => {
    expect(formatSelectableItem(testItem)).toBe('test-id');
  });

  test('includes extra info in brackets when provided', () => {
    expect(formatSelectableItem(testItem, 'extra info')).toBe('test-id [extra info]');
  });
});
