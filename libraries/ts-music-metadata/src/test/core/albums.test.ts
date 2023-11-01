import '@fgv/ts-utils-jest';
import * as Core from '../../packlets/core';

describe('Albums module', () => {
  const a1t1: Core.Model.IAlbum = {
    artist: 'artist 1',
    title: 'Title 1',
    tracks: []
  };
  const a1t1i123: Core.Model.IAlbum = {
    id: '123',
    artist: 'Artist 1',
    title: 'Title 1',
    tracks: []
  };
  const a2t1: Core.Model.IAlbum = {
    artist: 'Artist the Second',
    title: 'Title 1',
    tracks: []
  };
  const a2t1i123: Core.Model.IAlbum = {
    id: '123',
    artist: 'Artist The Second',
    title: 'Title 1',
    tracks: []
  };
  const a1t2: Core.Model.IAlbum = {
    artist: 'ARTIST 1!',
    title: 'Another Title!',
    tracks: []
  };
  const a2t2: Core.Model.IAlbum = {
    artist: 'artist the second',
    title: '(Another Title)',
    tracks: []
  };
  const a1t3: Core.Model.IAlbum = {
    disc: 1,
    artist: 'artIst 1',
    title: 'Album number 3',
    tracks: []
  };

  let albums: Core.Albums;
  beforeEach(() => {
    albums = new Core.Albums();
  });

  describe('add method', () => {
    test('adds an album with an id', () => {
      const album = a1t1i123;
      const { artist, title, id } = album;
      expect(albums.add(album)).toSucceedWith(album);
      expect(albums.count).toBe(1);
      expect(albums.get(id!)).toSucceedWith(album);
      expect(albums.find({ artist })).toSucceedWith([album]);
      expect(albums.find({ title })).toSucceedWith([album]);
    });

    test('adds an album without an id', () => {
      const album = a1t1;
      const { artist, title } = album;
      expect(albums.add(album)).toSucceedWith(album);
      expect(albums.count).toBe(1);
      expect(albums.get('123')).toFailWith(/not found/);
      expect(albums.find({ artist })).toSucceedWith([album]);
      expect(albums.find({ title })).toSucceedWith([album]);
    });

    test('adds non-conflicting albums', () => {
      const album1 = a1t1;
      const album2 = a2t2;
      expect(albums.add(album1)).toSucceedWith(album1);
      expect(albums.add(album2)).toSucceedWith(album2);
      expect(albums.count).toBe(2);

      {
        const { artist, title } = album1;
        expect(albums.get('123')).toFailWith(/not found/);
        expect(albums.find({ artist })).toSucceedWith([album1]);
        expect(albums.find({ title })).toSucceedWith([album1]);
      }

      {
        const { artist, title } = album2;
        expect(albums.get('123')).toFailWith(/not found/);
        expect(albums.find({ artist })).toSucceedWith([album2]);
        expect(albums.find({ title })).toSucceedWith([album2]);
      }
    });

    test('adds albums by the same artist', () => {
      const album1 = a1t1;
      const album2 = a1t2;
      expect(albums.add(album1)).toSucceedWith(album1);
      expect(albums.add(album2)).toSucceedWith(album2);
      expect(albums.count).toBe(2);

      {
        const { artist, title } = album1;
        expect(albums.get('123')).toFailWith(/not found/);
        expect(albums.find({ artist })).toSucceedWith([album1, album2]);
        expect(albums.find({ title })).toSucceedWith([album1]);
      }

      {
        const { artist, title } = album2;
        expect(albums.get('123')).toFailWith(/not found/);
        expect(albums.find({ artist })).toSucceedWith([album1, album2]);
        expect(albums.find({ title })).toSucceedWith([album2]);
      }
    });

    test('adds albums with the same title', () => {
      const album1 = a1t1;
      const album2 = a2t1;
      expect(albums.add(album1)).toSucceedWith(album1);
      expect(albums.add(album2)).toSucceedWith(album2);
      expect(albums.count).toBe(2);

      {
        const { artist, title } = album1;
        expect(albums.get('123')).toFailWith(/not found/);
        expect(albums.find({ artist })).toSucceedWith([album1]);
        expect(albums.find({ title })).toSucceedWith([album1, album2]);
        expect(albums.find({ artist, title })).toSucceedWith([album1]);
      }

      {
        const { artist, title } = album2;
        expect(albums.get('123')).toFailWith(/not found/);
        expect(albums.find({ artist })).toSucceedWith([album2]);
        expect(albums.find({ title })).toSucceedWith([album1, album2]);
        expect(albums.find({ artist, title })).toSucceedWith([album2]);
      }
    });

    test('fails when adding an album with a conflicting ID', () => {
      const album1 = a1t1i123;
      const album2 = a2t1i123;
      expect(albums.add(album1)).toSucceedWith(album1);
      expect(albums.add(album2)).toFailWith(/already exists/i);
      expect(albums.count).toBe(1);
    });

    test('fails when adding an album with a conflicting ID even if contents match', () => {
      const album1 = a1t1i123;
      const album2 = JSON.parse(JSON.stringify(album1));
      expect(albums.add(album1)).toSucceedWith(album1);
      expect(albums.add(album2)).toFailWith(/already exists/i);
      expect(albums.count).toBe(1);
    });

    test('silently succeeds without adding if an album (identity equals) is added multiple times', () => {
      const album1 = a1t1i123;
      expect(albums.add(album1)).toSucceedWith(album1);
      expect(albums.add(album1)).toSucceedWith(album1);
      expect(albums.count).toBe(1);
    });
  });

  describe('get method', () => {});

  describe('find method', () => {
    beforeEach(() => {
      albums.add(a1t1i123).orThrow();
      albums.add(a1t2).orThrow();
      albums.add(a2t1).orThrow();
      albums.add(a2t2).orThrow();
      albums.add(a1t3).orThrow();
    });
    test('fails if no matching artist is found', () => {
      const artist = 'Bogus artist';
      const { title } = a1t1;
      expect(albums.find({ artist, title })).toFailWith(/no match/i);
    });

    test('fails if no matching title is found', () => {
      const title = 'Bogus title';
      const { artist } = a1t1;
      expect(albums.find({ artist, title })).toFailWith(/no match/i);
    });

    test('fails if title is found for a different artist', () => {
      const { artist } = a2t1;
      const { title } = a1t3;
      expect(albums.find({ artist, title })).toFailWith(/no match/i);
    });

    test('fails if title is not found', () => {
      expect(albums.find({ title: 'bogus' })).toFailWith(/no match/i);
    });

    test('fails if artist is not found', () => {
      expect(albums.find({ artist: 'bogus' })).toFailWith(/no match/i);
    });
  });

  describe('normalizeKeys static method', () => {
    const tests: { from: Core.Model.AlbumKeys; to: Core.Model.AlbumKeys }[] = [
      // cSpell: disable
      {
        from: { artist: 'Various ARtists', title: 'Big Big Hits 2023!!!' },
        to: { artist: 'variousartists', title: 'bigbighits2023' }
      }
      // cSpell: enable
    ];
    test.each(tests)('Normalizes $from to $to', (t) => {
      expect(Core.Albums.normalizeKeys(t.from)).toEqual(t.to);
    });
  });

  describe(`normalizeAlbum static method`, () => {
    test('normalizes all key properties', () => {
      expect(Core.Albums.normalizeAlbum(a1t3)).toEqual({
        artist: 'artist1',
        disc: 1,
        // cSpell: disable
        title: 'albumnumber3'
        // cSpell: enable
      });
    });

    test('returns pre-normalized values if present', () => {
      const album = JSON.parse(JSON.stringify(a1t3));
      const normalized = Core.Albums.normalizeAlbum(album);
      const normalized2 = Core.Albums.normalizeAlbum(album);

      expect(normalized).toEqual(normalized2);
      expect(normalized).not.toBe(normalized2);

      const album2 = { ...album, normalized };
      expect(Core.Albums.normalizeAlbum(album2)).toBe(normalized);
    });
  });
});
