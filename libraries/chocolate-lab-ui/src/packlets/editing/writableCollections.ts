import type { IEntityCreateCollectionOption } from './EntityCreateForm';

interface IWritableCollectionEntry {
  readonly isMutable: boolean;
}

export function getWritableCollectionOptions<
  TCollectionId extends string,
  TCollectionEntry extends IWritableCollectionEntry
>(
  entries: Iterable<readonly [TCollectionId, TCollectionEntry]>,
  preferredId?: string
): ReadonlyArray<IEntityCreateCollectionOption> {
  const writable: Array<IEntityCreateCollectionOption> = [];
  let preferred: IEntityCreateCollectionOption | undefined;

  for (const [collectionId, collection] of entries) {
    if (!collection.isMutable) {
      continue;
    }

    const option: IEntityCreateCollectionOption = {
      id: collectionId,
      label: collectionId
    };

    if (preferredId !== undefined && collectionId === preferredId) {
      preferred = option;
      continue;
    }

    writable.push(option);
  }

  return preferred ? [preferred, ...writable] : writable;
}
