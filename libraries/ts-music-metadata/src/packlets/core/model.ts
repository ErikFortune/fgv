import '@fgv/ts-utils';

/**
 * Abstract definition of a single album.
 * @public
 */
export interface IAlbum {
  readonly id?: string;
  readonly disc?: number;
  readonly title: string;
  readonly artist: string;
  readonly tracks: ITrack[];
  readonly normalized?: AlbumKeys;
}

/**
 * Searchable keys for an abstract album.
 * @public
 */
export type AlbumKeys = Omit<IAlbum, 'id' | 'tracks' | 'normalized'>;

/**
 * Abstract definition of a single track.
 * @public
 */
export interface ITrack {
  readonly id?: string;
  readonly track?: number;
  readonly title: string;
  readonly artist: string;
  readonly album?: IAlbum;
  readonly normalized?: Omit<ITrack, 'normalized'>;
}
