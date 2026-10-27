/*
 * Copyright (c) 2026 Erik Fortune
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
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Result, fail } from '@fgv/ts-utils';
import {
  FsAbsolutePathPolicy,
  FsFileTreeAccessors,
  IFsFileTreeInitParams,
  allFsAbsolutePathPolicies,
  forFilesystem,
  isMutableDirectoryItem
} from '../../../packlets/file-tree';

/**
 * The layout every test builds afresh:
 *
 * ```
 * <base>/root/                  the prefix
 *          in.txt  sub/marker-inside.txt  emptyin/
 *          real/{s.txt, idir/marker-inside.txt, iempty/}
 *          insidelink -> real               (inside to inside)
 *          linkdir    -> ../outside         (directory inside to outside)
 *          linkfile   -> ../outside/out.txt (file inside to outside)
 *          linkempty  -> ../outside/empty
 *          dangling   -> ../outside/new.txt (target does not exist)
 * <base>/outside/  out.txt  odir/marker-outside.txt  empty/
 * <base>/rootx/    the same as outside — a sibling whose name starts with the prefix's
 * ```
 */
interface IFixture {
  readonly base: string;
  readonly root: string;
  readonly realRoot: string;
  readonly outside: string;
  readonly sibling: string;
}

function makeOutsideLayout(dir: string): void {
  fs.mkdirSync(path.join(dir, 'odir'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'empty'));
  fs.writeFileSync(path.join(dir, 'out.txt'), 'OUTSIDE');
  fs.writeFileSync(path.join(dir, 'odir', 'marker-outside.txt'), 'OUTSIDE');
}

function makeFixture(): IFixture {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-confine-'));
  const root = path.join(base, 'root');
  const outside = path.join(base, 'outside');
  const sibling = `${root}x`;
  makeOutsideLayout(outside);
  makeOutsideLayout(sibling);
  fs.mkdirSync(path.join(root, 'sub'), { recursive: true });
  fs.mkdirSync(path.join(root, 'emptyin'));
  fs.mkdirSync(path.join(root, 'real', 'idir'), { recursive: true });
  fs.mkdirSync(path.join(root, 'real', 'iempty'));
  fs.writeFileSync(path.join(root, 'in.txt'), 'INSIDE');
  fs.writeFileSync(path.join(root, 'sub', 'marker-inside.txt'), 'INSIDE');
  fs.writeFileSync(path.join(root, 'real', 's.txt'), 'INSIDE');
  fs.writeFileSync(path.join(root, 'real', 'idir', 'marker-inside.txt'), 'INSIDE');
  fs.symlinkSync('real', path.join(root, 'insidelink'));
  fs.symlinkSync(path.join('..', 'outside'), path.join(root, 'linkdir'));
  fs.symlinkSync(path.join('..', 'outside', 'out.txt'), path.join(root, 'linkfile'));
  fs.symlinkSync(path.join('..', 'outside', 'empty'), path.join(root, 'linkempty'));
  fs.symlinkSync(path.join('..', 'outside', 'new.txt'), path.join(root, 'dangling'));
  return { base, root, realRoot: fs.realpathSync(root), outside, sibling };
}

/**
 * Everything outside the prefix, as `relative path -> contents` (`<dir>` for a
 * directory), so a test can tell whether an operation changed anything there.
 */
function snapshotOutside(fx: IFixture): string {
  const entries: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(fx.base, full);
      if (entry.isDirectory()) {
        entries.push(`${rel}=<dir>`);
        walk(full);
      } else {
        entries.push(`${rel}=${fs.readFileSync(full, 'utf8')}`);
      }
    }
  };
  walk(fx.outside);
  walk(fx.sibling);
  return entries.join('\n');
}

/**
 * The real location a path names: the real path of the path itself or of its
 * nearest ancestor that exists.
 */
function realLocation(p: string): string {
  let probe = p;
  for (;;) {
    try {
      return fs.realpathSync(probe);
    } catch {
      const parent = path.dirname(probe);
      if (parent === probe) {
        return probe;
      }
      probe = parent;
    }
  }
}

function isWithin(outer: string, inner: string): boolean {
  return inner === outer || inner.startsWith(`${outer}${path.sep}`);
}

type PathClassKind = 'inside' | 'escape' | 'linkDir' | 'linkEntry' | 'literal';

interface IPathClass {
  readonly name: string;
  readonly kind: PathClassKind;
  /** An existing file. */
  readonly file: (fx: IFixture) => string;
  /** An existing directory with one child. */
  readonly dir: (fx: IFixture) => string;
  /** An existing empty directory. */
  readonly emptyDir: (fx: IFixture) => string;
  /** A file that does not exist yet. */
  readonly newFile: (fx: IFixture) => string;
  /** A directory that does not exist yet. */
  readonly newDir: (fx: IFixture) => string;
}

function outsideClass(name: string, at: (fx: IFixture) => string): IPathClass {
  return {
    name,
    kind: 'escape',
    file: (fx) => path.join(at(fx), 'out.txt'),
    dir: (fx) => path.join(at(fx), 'odir'),
    emptyDir: (fx) => path.join(at(fx), 'empty'),
    newFile: (fx) => path.join(at(fx), 'new.txt'),
    newDir: (fx) => path.join(at(fx), 'newdir')
  };
}

const pathClasses: ReadonlyArray<IPathClass> = [
  {
    name: 'absolute inside',
    kind: 'inside',
    file: (fx) => path.join(fx.root, 'in.txt'),
    dir: (fx) => path.join(fx.root, 'sub'),
    emptyDir: (fx) => path.join(fx.root, 'emptyin'),
    newFile: (fx) => path.join(fx.root, 'new.txt'),
    newDir: (fx) => path.join(fx.root, 'newdir')
  },
  {
    name: 'relative inside',
    kind: 'inside',
    file: () => 'in.txt',
    dir: () => 'sub',
    emptyDir: () => 'emptyin',
    newFile: () => 'new.txt',
    newDir: () => 'newdir'
  },
  outsideClass('absolute outside', (fx) => fx.outside),
  {
    // Relative to the prefix, climbing out of it.
    name: 'relative .. escape',
    kind: 'escape',
    file: () => '../outside/out.txt',
    dir: () => '../outside/odir',
    emptyDir: () => '../outside/empty',
    newFile: () => '../outside/new.txt',
    newDir: () => '../outside/newdir'
  },
  // Absolute, naming the prefix and then climbing out of it. `path.join` would
  // collapse the `..`, so these are spelled out.
  outsideClass('absolute .. escape', (fx) => `${fx.root}${path.sep}..${path.sep}outside`),
  outsideClass('prefix-lookalike sibling', (fx) => fx.sibling),
  {
    // Every target lies beneath a directory inside the prefix that is a
    // symbolic link to a directory outside it.
    name: 'symlinked directory inside -> outside',
    kind: 'linkDir',
    file: (fx) => path.join(fx.root, 'linkdir', 'out.txt'),
    dir: (fx) => path.join(fx.root, 'linkdir', 'odir'),
    emptyDir: (fx) => path.join(fx.root, 'linkdir', 'empty'),
    newFile: (fx) => path.join(fx.root, 'linkdir', 'new.txt'),
    newDir: (fx) => path.join(fx.root, 'linkdir', 'newdir')
  },
  {
    // Every target is itself a symbolic link inside the prefix whose target is
    // outside it; the new file is a dangling link.
    name: 'symlinked entry inside -> outside',
    kind: 'linkEntry',
    file: (fx) => path.join(fx.root, 'linkfile'),
    dir: (fx) => path.join(fx.root, 'linkdir'),
    emptyDir: (fx) => path.join(fx.root, 'linkempty'),
    newFile: (fx) => path.join(fx.root, 'dangling'),
    newDir: (fx) => path.join(fx.root, 'linkdir')
  },
  {
    name: 'symlink inside -> inside',
    kind: 'inside',
    file: (fx) => path.join(fx.root, 'insidelink', 's.txt'),
    dir: (fx) => path.join(fx.root, 'insidelink', 'idir'),
    emptyDir: (fx) => path.join(fx.root, 'insidelink', 'iempty'),
    newFile: (fx) => path.join(fx.root, 'insidelink', 'new.txt'),
    newDir: (fx) => path.join(fx.root, 'insidelink', 'newdir')
  },
  {
    // On POSIX a backslash is an ordinary filename character, so this names one
    // oddly-spelled entry inside the prefix. On Windows it is a `..` escape.
    name: 'Windows-style separators',
    kind: path.sep === '\\' ? 'escape' : 'literal',
    file: () => '..\\outside\\out.txt',
    dir: () => '..\\outside\\odir',
    emptyDir: () => '..\\outside\\empty',
    newFile: () => '..\\outside\\new.txt',
    newDir: () => '..\\outside\\newdir'
  }
];

type OperationKind = 'read' | 'write' | 'atomic';

interface IOperation {
  readonly name: string;
  readonly kind: OperationKind;
  /** The input the operation is given, for judging where an inquiry looked. */
  readonly target: (c: IPathClass, fx: IFixture) => string;
  readonly run: (a: FsFileTreeAccessors, target: string) => Result<unknown>;
}

const operations: ReadonlyArray<IOperation> = [
  { name: 'read', kind: 'read', target: (c, fx) => c.file(fx), run: (a, t) => a.getFileContents(t) },
  { name: 'readBytes', kind: 'read', target: (c, fx) => c.file(fx), run: (a, t) => a.getFileBytes(t) },
  { name: 'readStrict', kind: 'read', target: (c, fx) => c.file(fx), run: (a, t) => a.getFileTextStrict(t) },
  { name: 'stat', kind: 'read', target: (c, fx) => c.file(fx), run: (a, t) => a.getItem(t) },
  { name: 'list', kind: 'read', target: (c, fx) => c.dir(fx), run: (a, t) => a.getChildren(t) },
  { name: 'realPath', kind: 'read', target: (c, fx) => c.file(fx), run: (a, t) => a.resolveRealPath(t) },
  {
    name: 'isMutable',
    kind: 'read',
    target: (c, fx) => c.file(fx),
    run: (a, t) => a.fileIsMutable(t).asResult
  },
  {
    name: 'save',
    kind: 'write',
    target: (c, fx) => c.file(fx),
    run: (a, t) => a.saveFileContents(t, 'WRITTEN')
  },
  {
    name: 'saveBytes',
    kind: 'write',
    target: (c, fx) => c.newFile(fx),
    run: (a, t) => a.saveFileBytes(t, new TextEncoder().encode('WRITTEN'))
  },
  {
    name: 'createDirectory',
    kind: 'write',
    target: (c, fx) => c.newDir(fx),
    run: (a, t) => a.createDirectory(t)
  },
  { name: 'deleteFile', kind: 'write', target: (c, fx) => c.file(fx), run: (a, t) => a.deleteFile(t) },
  {
    name: 'deleteDirectory',
    kind: 'write',
    target: (c, fx) => c.emptyDir(fx),
    run: (a, t) => a.deleteDirectory(t)
  },
  {
    name: 'atomicCapabilities',
    kind: 'atomic',
    target: (c, fx) => c.dir(fx),
    run: (a, t) => a.getAtomicWriteCapabilities(t)
  },
  {
    name: 'atomicWrite',
    kind: 'atomic',
    target: (c, fx) => c.newFile(fx),
    run: (a, t) => a.writeFileAtomically(t, 'WRITTEN', { guarantee: 'process-crash' }).asResult
  },
  {
    name: 'atomicCleanup',
    kind: 'atomic',
    target: (c, fx) => c.dir(fx),
    run: (a, t) => a.cleanupAtomicTemporaries(t)
  }
];

interface IConfig {
  readonly name: string;
  readonly params: Omit<IFsFileTreeInitParams, 'prefix' | 'mutable'>;
  readonly policy: FsAbsolutePathPolicy;
  readonly realPath: boolean;
}

const configs: ReadonlyArray<IConfig> = [
  { name: 'unconfined (default)', params: {}, policy: 'unconfined', realPath: false },
  { name: 'confined', params: { absolutePathPolicy: 'confined' }, policy: 'confined', realPath: false },
  {
    name: 'confined + realPath',
    params: { absolutePathPolicy: 'confined', realPath: true },
    policy: 'confined',
    realPath: true
  },
  {
    name: 'verified (realPath by default)',
    params: { absolutePathPolicy: 'verified' },
    policy: 'verified',
    realPath: true
  },
  {
    name: 'verified, realPath: false',
    params: { absolutePathPolicy: 'verified', realPath: false },
    policy: 'verified',
    realPath: false
  }
];

/**
 * - `escapes`: the operation changed something outside the prefix, or a read or
 *   inquiry succeeded against a location outside it.
 * - `refused`: the operation failed with a confinement message and touched nothing.
 * - `contained`: anything else — it succeeded inside the prefix, or failed for an
 *   ordinary reason (not found, not a directory) without touching the outside.
 */
type Outcome = 'escapes' | 'refused' | 'contained';

const CONFINEMENT_MESSAGE: RegExp = /(outside|inside) the tree (prefix|root)/;

function observe(cfg: IConfig, c: IPathClass, op: IOperation): Outcome {
  const fx = makeFixture();
  try {
    const accessors = new FsFileTreeAccessors({ prefix: fx.root, mutable: true, ...cfg.params });
    const target = op.target(c, fx);
    const before = snapshotOutside(fx);
    const result = op.run(accessors, target);
    if (snapshotOutside(fx) !== before) {
      return 'escapes';
    }
    if (result.isFailure()) {
      return CONFINEMENT_MESSAGE.test(result.message) ? 'refused' : 'contained';
    }
    if (op.kind === 'read' && !isWithin(fx.realRoot, realLocation(accessors.resolveAbsolutePath(target)))) {
      return 'escapes';
    }
    return 'contained';
  } finally {
    fs.rmSync(fx.base, { recursive: true, force: true });
  }
}

/**
 * The decided design, as a table: what each operation must do for each path
 * class under each configuration.
 */
function expectedOutcome(cfg: IConfig, c: IPathClass, op: IOperation): Outcome {
  switch (c.kind) {
    case 'inside':
    case 'literal':
      return 'contained';
    case 'escape':
      if (cfg.policy === 'confined') {
        // Mapped beneath the prefix, so nothing outside is reachable.
        return 'contained';
      }
      // The atomic methods have always confined; under `verified` everything does.
      return cfg.policy === 'verified' || op.kind === 'atomic' ? 'refused' : 'escapes';
    case 'linkDir':
      // The atomic methods have always checked the containing directory's real path.
      return cfg.realPath || op.kind === 'atomic' ? 'refused' : 'escapes';
    case 'linkEntry':
      if (cfg.realPath) {
        return 'refused';
      }
      if (op.name === 'atomicCapabilities' || op.name === 'atomicCleanup') {
        // Their target is the link to the outside directory, whose real path is outside.
        return 'refused';
      }
      // Removing a link, failing to rmdir one, and mkdir -p of an existing one touch
      // only the link; an atomic write replaces the link rather than following it.
      return ['deleteFile', 'deleteDirectory', 'createDirectory', 'atomicWrite'].includes(op.name)
        ? 'contained'
        : 'escapes';
  }
}

describe('FsFileTreeAccessors prefix confinement — escape matrix', () => {
  for (const cfg of configs) {
    describe(cfg.name, () => {
      for (const c of pathClasses) {
        test(`${c.name}`, () => {
          const observed: Record<string, Outcome> = {};
          const expected: Record<string, Outcome> = {};
          for (const op of operations) {
            observed[op.name] = observe(cfg, c, op);
            expected[op.name] = expectedOutcome(cfg, c, op);
          }
          expect(observed).toEqual(expected);
        });
      }
    });
  }
});

describe('FsFileTreeAccessors prefix confinement — options', () => {
  test('defaults to unconfined with no real-path check, as before', () => {
    const accessors = new FsFileTreeAccessors({ prefix: '/some/prefix' });
    expect(accessors.absolutePathPolicy).toBe('unconfined');
    expect(accessors.realPath).toBe(false);
    expect(new FsFileTreeAccessors().absolutePathPolicy).toBe('unconfined');
  });

  test('realPath defaults on under verified and off under confined', () => {
    expect(
      FsFileTreeAccessors.create({ prefix: '/p', absolutePathPolicy: 'verified' }).orThrow().realPath
    ).toBe(true);
    expect(
      FsFileTreeAccessors.create({ prefix: '/p', absolutePathPolicy: 'confined' }).orThrow().realPath
    ).toBe(false);
    expect(
      FsFileTreeAccessors.create({ prefix: '/p', absolutePathPolicy: 'confined', realPath: true }).orThrow()
        .realPath
    ).toBe(true);
    expect(
      FsFileTreeAccessors.create({ prefix: '/p', absolutePathPolicy: 'verified', realPath: false }).orThrow()
        .realPath
    ).toBe(false);
  });

  test('lists every policy', () => {
    expect(allFsAbsolutePathPolicies).toEqual(['unconfined', 'confined', 'verified']);
  });

  test.each(['confined', 'verified'] as const)('create fails for %s with no prefix', (policy) => {
    expect(FsFileTreeAccessors.create({ absolutePathPolicy: policy })).toFailWith(
      policy === 'confined' ? /'confined' requires a prefix/ : /'verified' requires a prefix/
    );
    expect(FsFileTreeAccessors.create({ absolutePathPolicy: policy, prefix: '' })).toFailWith(
      /requires a prefix/
    );
    expect(() => new FsFileTreeAccessors({ absolutePathPolicy: policy })).toThrow(/requires a prefix/);
    expect(forFilesystem({ absolutePathPolicy: policy })).toFailWith(/requires a prefix/);
  });

  test('create fails for realPath under unconfined, with or without a prefix', () => {
    expect(FsFileTreeAccessors.create({ realPath: true })).toFailWith(/realPath requires/);
    expect(FsFileTreeAccessors.create({ realPath: true, prefix: '/p' })).toFailWith(/realPath requires/);
    expect(FsFileTreeAccessors.create({ realPath: true, absolutePathPolicy: 'unconfined' })).toFailWith(
      /realPath requires/
    );
  });

  test('create fails for an unknown policy', () => {
    expect(
      FsFileTreeAccessors.create({
        prefix: '/p',
        absolutePathPolicy: 'sandboxed' as unknown as FsAbsolutePathPolicy
      })
    ).toFailWith(/absolutePathPolicy:.*sandboxed/);
  });

  test('create succeeds for the default and for a prefixed policy', () => {
    expect(FsFileTreeAccessors.create()).toSucceedAndSatisfy((a) => {
      expect(a.prefix).toBeUndefined();
      expect(a.absolutePathPolicy).toBe('unconfined');
    });
    expect(FsFileTreeAccessors.create({ prefix: '/p', absolutePathPolicy: 'verified' })).toSucceed();
  });
});

describe('FsFileTreeAccessors prefix confinement — path resolution', () => {
  const prefix = path.resolve('/srv/tree');

  test('unconfined uses an absolute path as given', () => {
    const accessors = new FsFileTreeAccessors({ prefix });
    expect(accessors.resolveAbsolutePath('/etc/passwd')).toBe(path.resolve('/etc/passwd'));
    expect(accessors.resolveAbsolutePath('../x')).toBe(path.resolve('/srv/x'));
  });

  describe('confined', () => {
    const accessors = new FsFileTreeAccessors({ prefix, absolutePathPolicy: 'confined' });

    test('prepends the prefix to an absolute path outside it', () => {
      expect(accessors.resolveAbsolutePath('/etc/passwd')).toBe(path.join(prefix, 'etc', 'passwd'));
      expect(accessors.resolveAbsolutePath('/')).toBe(prefix);
    });

    test('leaves a path already under the prefix alone, which makes the mapping idempotent', () => {
      const inside = path.join(prefix, 'a', 'b.txt');
      expect(accessors.resolveAbsolutePath(inside)).toBe(inside);
      expect(accessors.resolveAbsolutePath(prefix)).toBe(prefix);
      for (const input of ['/etc/passwd', '../x', 'a/../../../y', '/srv/treex/z']) {
        const once = accessors.resolveAbsolutePath(input);
        expect(accessors.resolveAbsolutePath(once)).toBe(once);
      }
    });

    test('never re-prefixes, so a doubled prefix is reachable only through a relative path', () => {
      // The documented ambiguity: `<prefix>/srv/tree/a` cannot be named absolutely,
      // because `/srv/tree/a` is already under the prefix.
      expect(accessors.resolveAbsolutePath('/srv/tree/a')).toBe(path.join(prefix, 'a'));
      expect(accessors.resolveAbsolutePath('srv/tree/a')).toBe(path.join(prefix, 'srv', 'tree', 'a'));
    });

    test('treats a prefix lookalike as outside', () => {
      expect(accessors.resolveAbsolutePath('/srv/treex/a')).toBe(path.join(prefix, 'srv', 'treex', 'a'));
    });

    test('resolves a relative escape as though the prefix were the root', () => {
      expect(accessors.resolveAbsolutePath('../x')).toBe(path.join(prefix, 'x'));
      expect(accessors.resolveAbsolutePath('../../../x')).toBe(path.join(prefix, 'x'));
      expect(accessors.resolveAbsolutePath('a/../../q/x')).toBe(path.join(prefix, 'q', 'x'));
      expect(accessors.resolveAbsolutePath('a', '..', '..', 'y')).toBe(path.join(prefix, 'y'));
    });

    test('maps a later absolute segment the same way', () => {
      expect(accessors.resolveAbsolutePath('a', '/etc')).toBe(path.join(prefix, 'etc'));
      expect(accessors.resolveAbsolutePath('/etc', 'x')).toBe(path.join(prefix, 'etc', 'x'));
    });
  });

  test('verified resolves as unconfined does, and refuses at the operation', () => {
    const accessors = new FsFileTreeAccessors({ prefix, absolutePathPolicy: 'verified' });
    expect(accessors.resolveAbsolutePath('/etc/passwd')).toBe(path.resolve('/etc/passwd'));
    expect(accessors.getFileContents('/etc/passwd')).toFailWith(
      /\/etc\/passwd: resolves outside the tree prefix '.*srv.tree'$/
    );
  });

  describe('a root prefix', () => {
    let fx: IFixture;
    beforeEach(() => {
      fx = makeFixture();
    });
    afterEach(() => {
      fs.rmSync(fx.base, { recursive: true, force: true });
    });

    test.each(['confined', 'verified'] as const)('%s with prefix / reaches every absolute path', (policy) => {
      const accessors = new FsFileTreeAccessors({
        prefix: path.parse(fx.root).root,
        absolutePathPolicy: policy
      });
      const outsideFile = path.join(fx.outside, 'out.txt');
      expect(accessors.resolveAbsolutePath(outsideFile)).toBe(outsideFile);
      expect(accessors.getFileContents(outsideFile)).toSucceedWith('OUTSIDE');
      expect(accessors.resolveAbsolutePath('../..')).toBe(path.parse(fx.root).root);
    });
  });
});

describe('FsFileTreeAccessors prefix confinement — through the tree', () => {
  let fx: IFixture;
  beforeEach(() => {
    fx = makeFixture();
  });
  afterEach(() => {
    fs.rmSync(fx.base, { recursive: true, force: true });
  });

  test('confined: getDirectory("/") names the prefix, not the filesystem root', () => {
    const tree = forFilesystem({ prefix: fx.root, absolutePathPolicy: 'confined' }).orThrow();
    expect(tree.getDirectory('/')).toSucceedAndSatisfy((dir) => {
      expect(dir.absolutePath).toBe(fx.root);
      expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children.map((c) => c.name)).toContain('in.txt');
      });
    });
    expect(tree.getFile('/in.txt')).toSucceedAndSatisfy((file) => {
      expect(file.getRawContents()).toSucceedWith('INSIDE');
    });
  });

  test('unconfined: getDirectory("/") still names the filesystem root, as before', () => {
    const tree = forFilesystem(fx.root).orThrow();
    expect(tree.getDirectory('/')).toSucceedAndSatisfy((dir) => {
      expect(dir.absolutePath).toBe(path.parse(fx.root).root);
    });
  });

  test('verified: getDirectory("/") is refused', () => {
    const tree = forFilesystem({ prefix: fx.root, absolutePathPolicy: 'verified' }).orThrow();
    expect(tree.getDirectory('/')).toFailWith(/resolves outside the tree prefix/);
  });

  test('confined: a mutable directory item writes beneath the prefix', () => {
    const tree = forFilesystem({ prefix: fx.root, absolutePathPolicy: 'confined', mutable: true }).orThrow();
    const created = tree
      .getDirectory('/')
      .onSuccess((dir) =>
        isMutableDirectoryItem(dir)
          ? dir.createChildDirectory('made')
          : fail(`${dir.absolutePath}: not mutable`)
      );
    expect(created).toSucceed();
    expect(fs.statSync(path.join(fx.root, 'made')).isDirectory()).toBe(true);
  });

  test('confined: writing to an absolute path outside lands at the mapped path', () => {
    const accessors = new FsFileTreeAccessors({
      prefix: fx.root,
      absolutePathPolicy: 'confined',
      mutable: true
    });
    expect(accessors.createDirectory('/mapped/deep')).toSucceedWith(path.join(fx.root, 'mapped', 'deep'));
    expect(accessors.saveFileContents('/mapped/deep/f.txt', 'X')).toSucceedWith('X');
    expect(fs.readFileSync(path.join(fx.root, 'mapped', 'deep', 'f.txt'), 'utf8')).toBe('X');
  });
});

describe('FsFileTreeAccessors prefix confinement — real paths', () => {
  let fx: IFixture;
  beforeEach(() => {
    fx = makeFixture();
  });
  afterEach(() => {
    fs.rmSync(fx.base, { recursive: true, force: true });
  });

  test('names the link, its target and the prefix when refusing', () => {
    const accessors = new FsFileTreeAccessors({ prefix: fx.root, absolutePathPolicy: 'verified' });
    expect(accessors.getFileContents(path.join(fx.root, 'linkfile'))).toFailWith(
      /linkfile: resolves through a symbolic link to '.*outside.*out\.txt', outside the tree prefix/
    );
  });

  test('refuses a missing path beneath a link that leads outside', () => {
    const accessors = new FsFileTreeAccessors({
      prefix: fx.root,
      absolutePathPolicy: 'verified',
      mutable: true
    });
    expect(accessors.createDirectory(path.join(fx.root, 'linkdir', 'a', 'b'))).toFailWith(/symbolic link/);
    expect(fs.existsSync(path.join(fx.outside, 'a'))).toBe(false);
  });

  test('refuses a dangling link, whose target cannot be checked', () => {
    const accessors = new FsFileTreeAccessors({
      prefix: fx.root,
      absolutePathPolicy: 'confined',
      realPath: true,
      mutable: true
    });
    expect(accessors.saveFileContents(path.join(fx.root, 'dangling'), 'X')).toFailWith(
      /dangling.*symbolic link.*cannot be resolved.*inside the tree prefix/
    );
    expect(fs.existsSync(path.join(fx.outside, 'new.txt'))).toBe(false);
  });

  test('accepts a dangling link whose target would be inside only after it exists', () => {
    fs.symlinkSync('later.txt', path.join(fx.root, 'pending'));
    const accessors = new FsFileTreeAccessors({
      prefix: fx.root,
      absolutePathPolicy: 'verified',
      mutable: true
    });
    expect(accessors.saveFileContents(path.join(fx.root, 'pending'), 'X')).toFailWith(/cannot be resolved/);
    fs.writeFileSync(path.join(fx.root, 'later.txt'), 'L');
    expect(accessors.saveFileContents(path.join(fx.root, 'pending'), 'X')).toSucceedWith('X');
  });

  test('accepts a prefix that is itself a symbolic link', () => {
    const linkedRoot = path.join(fx.base, 'rootlink');
    fs.symlinkSync('root', linkedRoot);
    const accessors = new FsFileTreeAccessors({ prefix: linkedRoot, absolutePathPolicy: 'verified' });
    expect(accessors.getFileContents('in.txt')).toSucceedWith('INSIDE');
    expect(accessors.getFileContents(path.join(linkedRoot, 'linkfile'))).toFailWith(/symbolic link/);
  });

  test('leaves a prefix that does not exist to the operation', () => {
    const missing = path.join(fx.base, 'nope');
    const accessors = new FsFileTreeAccessors({ prefix: missing, absolutePathPolicy: 'verified' });
    expect(accessors.getFileContents('a/b.txt')).toFailWith(/ENOENT/);
  });

  test('confined without realPath still follows a link out, as documented', () => {
    const accessors = new FsFileTreeAccessors({ prefix: fx.root, absolutePathPolicy: 'confined' });
    expect(accessors.getFileContents(path.join(fx.root, 'linkfile'))).toSucceedWith('OUTSIDE');
  });
});
