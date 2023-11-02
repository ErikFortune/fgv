import { Result, fail, succeed } from '@fgv/ts-utils';
import { normalize } from './ids';
import * as Model from './model';

/**
 * Searchable collection of {@link Core.Model.IAlbum | IAlbum}.
 * @public
 */
export class Albums<TA extends Model.IAlbum = Model.IAlbum> {
  /**
   * @internal
   */
  protected _byId: Map<string, TA> = new Map();

  /**
   * @internal
   */
  protected _byArtist: Map<string, TA[]> = new Map();

  /**
   * @internal
   */
  protected _byTitle: Map<string, TA[]> = new Map();

  /**
   * @internal
   */
  protected _all: TA[] = [];

  /**
   * The total number of albums present
   */
  public get count(): number {
    return this._all.length;
  }

  /**
   * Adds an album, failing if an album with a matching ID already exists.
   * @param album - The album to be added.
   */
  public add(album: TA): Result<TA> {
    const have = album.id ? this._byId.get(album.id) : undefined;
    if (have === undefined) {
      const normalized = Albums.normalizeAlbum(album);
      if (album.id) {
        this._byId.set(album.id, album);
      }

      const byArtist = this._byArtist.get(normalized.artist);
      if (byArtist) {
        byArtist.push(album);
      } else {
        this._byArtist.set(normalized.artist, [album]);
      }

      const byTitle = this._byTitle.get(normalized.title);
      if (byTitle) {
        byTitle.push(album);
      } else {
        this._byTitle.set(normalized.title, [album]);
      }

      this._all.push(album);
    } else if (have !== album) {
      return fail(`${album.id}: Album ID already exists`);
    }
    return succeed(album);
  }

  /**
   * Gets a single album by id.
   * @param id - The `id` of the album to be retrieved.
   * @returns `Success` with the matching album, or `Failure` with
   * a message if no matching album is found.
   */
  public get(id: string): Result<TA> {
    const have = this._byId.get(id);
    return have ? succeed(have) : fail(`${id}: album not found`);
  }

  /**
   * Finds albums matching a key.
   * @param want - A Partial&lt;{@link Core.Model.AlbumKeys | AlbumKeys}&gt; describing the albums to be found.
   * @returns `Success` with an array of matching albums, or `Failure` with a message if no matching
   * albums are found.
   */
  public find(want: Partial<Model.AlbumKeys>): Result<TA[]> {
    const normalizedKeys = Albums.normalizeKeys(want);
    let found: TA[] | undefined;
    if (normalizedKeys.artist) {
      found = this._byArtist.get(normalizedKeys.artist);
      if (normalizedKeys.title) {
        found = found?.filter((a) => normalize(a.title) === normalizedKeys.title);
      }
    } else if (normalizedKeys.title) {
      found = this._byTitle.get(normalizedKeys.title);
    }
    if (!found || found.length === 0) {
      return fail(`No matching albums found for "${want.artist ?? '*'}"/"${want.title ?? '*'}"`);
    }
    return succeed(found);
  }

  /**
   * Normalizes a supplied {@link Core.Model.AlbumKeys | AlbumKeys}.
   * @param keys - The {@link Core.Model.AlbumKeys | AlbumKeys} to be normalized.
   */
  public static normalizeKeys(keys: Model.AlbumKeys): Model.AlbumKeys;

  /**
   * Normalizes a supplied Partial&lt;{@link Core.Model.AlbumKeys | AlbumKeys}&gt;.
   * @param keys - The Partial&lt;{@link Core.Model.AlbumKeys | AlbumKeys}&gt; to be normalized.
   */
  public static normalizeKeys(keys: Partial<Model.AlbumKeys>): Partial<Model.AlbumKeys>;
  public static normalizeKeys(keys: Partial<Model.AlbumKeys>): Partial<Model.AlbumKeys> {
    const { disc } = keys;
    const title = normalize(keys.title);
    const artist = normalize(keys.artist);
    return {
      ...(disc ? { disc } : {}),
      title,
      artist
    };
  }

  /**
   * Returns normalized {@link Core.Model.AlbumKeys | AlbumKeys} for a supplied album, preferring
   * those from the object itself, if present.
   * @param album - The album to be normalized.
   * @returns
   */
  public static normalizeAlbum<TA extends Model.IAlbum = Model.IAlbum>(album: TA): Model.AlbumKeys {
    return album.normalized ?? Albums.normalizeKeys(album);
  }
}
