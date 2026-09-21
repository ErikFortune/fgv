/*
 * Copyright (c) 2025 Erik Fortune
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
import path from 'path';
import { DirectoryItem, FsFileTreeAccessors, isAtomicAccessors } from '../../../packlets/file-tree';
import { atomicTestRoots, isQualified } from './atomicTestRoots';

/**
 * End-to-end through the public accessors and directory item, against every
 * real filesystem this machine offers that the qualification table recognizes.
 *
 * The filesystem each block runs on is reported in its name, so the matrix in
 * the stream's `result.md` is a transcript of what actually ran rather than a
 * claim about what was intended to run.
 */

const OLD: string = '{"revision":1}\n';
const NEW: string = '{"revision":2}\n';

describe('the qualification evidence is actually being gathered', () => {
  test('at least one discovered root is qualified, so the committing tests are not all skipped', () => {
    // Without this, moving CI onto a filesystem the allowlist does not name
    // would turn every committing and crash-survival test into a silent skip.
    // The suite would stay green and the evidence behind the durability claim
    // would quietly stop existing. Silence is not success.
    const roots = atomicTestRoots();
    expect(roots.length).toBeGreaterThan(0);
    expect(roots.some((root) => isQualified(root.base))).toBe(true);
  });
});

describe.each(atomicTestRoots())('FsFileTreeAccessors atomic writes on $label', ({ base }) => {
  const qualified: boolean = isQualified(base);
  // A root the qualification table does not recognize cannot commit at all, so
  // the committing tests do not run there. The refusal itself is asserted below
  // and on every platform.
  const whenQualified: jest.It = qualified ? test : test.skip;

  let root: string;
  let accessors: FsFileTreeAccessors;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(base, 'fgv-atomic-fs-'));
    accessors = new FsFileTreeAccessors({ prefix: root, mutable: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('the filesystem accessors now advertise the atomic capability', () => {
    expect(isAtomicAccessors(accessors)).toBe(true);
  });

  test('reports capabilities for the root, and never claims more than process-crash', () => {
    expect(accessors.getAtomicWriteCapabilities(root)).toSucceedAndSatisfy((capabilities) => {
      expect(capabilities.atomicReplace).toBe(qualified);
      expect(capabilities.guarantees).not.toContain('os-crash');
      expect(capabilities.guarantees).not.toContain('power-loss');
      if (qualified) {
        expect(capabilities.guarantees).toEqual(['session', 'process-crash']);
      }
    });
  });

  test('fails the capability inquiry for a directory that is not there', () => {
    expect(accessors.getAtomicWriteCapabilities(path.join(root, 'absent'))).toFailWith(/not found/i);
  });

  whenQualified('creates a record and reads back exactly what was committed', () => {
    const target = path.join(root, 'record.json');
    expect(accessors.writeFileAtomically(target, NEW, { guarantee: 'process-crash' })).toSucceedAndSatisfy(
      (receipt) => {
        expect(receipt.replaced).toBe(false);
        expect(receipt.guarantee).toBe('process-crash');
      }
    );
    // Strict UTF-8 readback, which is what the design requires of a durable
    // Node record: a byte sequence that is not valid UTF-8 must fail loudly
    // rather than decode to replacement characters.
    expect(accessors.getFileTextStrict(target)).toSucceedWith(NEW);
  });

  whenQualified('replaces a record written by the ordinary save path', () => {
    const target = path.join(root, 'record.json');
    expect(accessors.saveFileContents(target, OLD)).toSucceed();
    expect(accessors.writeFileAtomically(target, NEW, { guarantee: 'process-crash' })).toSucceedAndSatisfy(
      (receipt) => {
        expect(receipt.replaced).toBe(true);
      }
    );
    expect(accessors.getFileTextStrict(target)).toSucceedWith(NEW);
  });

  whenQualified('honors a weaker requested guarantee without weakening the write', () => {
    const target = path.join(root, 'session.json');
    expect(accessors.writeFileAtomically(target, NEW, { guarantee: 'session' })).toSucceedAndSatisfy(
      (receipt) => {
        // The receipt states the guarantee that was contracted for, never one
        // weaker than the caller asked for.
        expect(receipt.guarantee).toBe('session');
      }
    );
    expect(fs.readFileSync(target, 'utf8')).toBe(NEW);
  });

  test.each([['os-crash' as const], ['power-loss' as const]])(
    'refuses a %s request before creating anything',
    (guarantee) => {
      const target = path.join(root, 'too-strong.json');
      expect(accessors.writeFileAtomically(target, NEW, { guarantee })).toFailWithDetail(
        /atomic writes are not available here|exceeds what this root can honor/i,
        { code: 'unsupported', stage: 'validate', visibility: 'unchanged' }
      );
      expect(fs.existsSync(target)).toBe(false);
      expect(fs.readdirSync(root)).toEqual([]);
    }
  );

  whenQualified('refuses a destination that is a directory', () => {
    const target = path.join(root, 'adirectory');
    fs.mkdirSync(target);
    expect(accessors.writeFileAtomically(target, NEW, { guarantee: 'process-crash' })).toFailWithDetail(
      /destination is a directory/i,
      { code: 'not-writable', stage: 'validate', visibility: 'unchanged' }
    );
    expect(fs.statSync(target).isDirectory()).toBe(true);
  });

  whenQualified('refuses a path that resolves outside the tree root', () => {
    // `resolveAbsolutePath` ignores the prefix for an already-absolute input, so
    // confinement has to be checked rather than assumed.
    const outside = path.join(path.dirname(root), 'escaped.json');
    expect(accessors.writeFileAtomically(outside, NEW, { guarantee: 'process-crash' })).toFailWithDetail(
      /resolves outside the tree root/i,
      { code: 'not-writable', stage: 'validate', visibility: 'unchanged' }
    );
    expect(fs.existsSync(outside)).toBe(false);
  });

  whenQualified('fails when the containing directory does not exist', () => {
    const target = path.join(root, 'missing-dir', 'record.json');
    expect(accessors.writeFileAtomically(target, NEW, { guarantee: 'process-crash' })).toFailWithDetail(
      /not found/i,
      { code: 'not-writable', stage: 'validate', visibility: 'unchanged' }
    );
  });

  whenQualified('reclaims orphaned temporaries and leaves host files alone', () => {
    const orphan = '.fgv-atomic-0123456789abcdef01234567.tmp';
    fs.writeFileSync(path.join(root, orphan), 'half a record');
    fs.writeFileSync(path.join(root, 'record.json'), OLD);

    expect(accessors.cleanupAtomicTemporaries(root)).toSucceedWith([orphan]);
    expect(fs.existsSync(path.join(root, orphan))).toBe(false);
    expect(fs.readFileSync(path.join(root, 'record.json'), 'utf8')).toBe(OLD);
  });

  whenQualified('reclaims nothing when there is nothing to reclaim', () => {
    expect(accessors.cleanupAtomicTemporaries(root)).toSucceedWith([]);
  });

  whenQualified('refuses to reclaim outside the tree root', () => {
    expect(accessors.cleanupAtomicTemporaries(path.dirname(root))).toFailWith(
      /resolves outside the tree root/i
    );
  });

  whenQualified('leaves ordinary saves exactly as they were', () => {
    // The atomic capability is a sibling, not a replacement. An ordinary save
    // still writes in place and still reports its own result shape.
    const target = path.join(root, 'ordinary.json');
    expect(accessors.saveFileContents(target, OLD)).toSucceedWith(OLD);
    expect(accessors.getFileContents(target)).toSucceedWith(OLD);
    expect(accessors.saveFileContents(target, NEW)).toSucceedWith(NEW);
    expect(accessors.getFileContents(target)).toSucceedWith(NEW);
  });

  describe('through an injected directory item, with no native path in sight', () => {
    whenQualified('writes a child atomically and reports the guarantee it honored', () => {
      const directory = DirectoryItem.create('.', accessors).orThrow();
      expect(directory.getAtomicWriteCapabilities()).toSucceedAndSatisfy((capabilities) => {
        expect(capabilities.guarantees).toContain('process-crash');
      });
      expect(
        directory.writeChildAtomically('record.json', NEW, { guarantee: 'process-crash' })
      ).toSucceedAndSatisfy((receipt) => {
        expect(receipt.replaced).toBe(false);
        expect(receipt.guarantee).toBe('process-crash');
      });
      expect(fs.readFileSync(path.join(root, 'record.json'), 'utf8')).toBe(NEW);
    });

    whenQualified('replaces a child atomically', () => {
      fs.writeFileSync(path.join(root, 'record.json'), OLD);
      const directory = DirectoryItem.create('.', accessors).orThrow();
      expect(
        directory.writeChildAtomically('record.json', NEW, { guarantee: 'process-crash' })
      ).toSucceedAndSatisfy((receipt) => {
        expect(receipt.replaced).toBe(true);
      });
      expect(fs.readFileSync(path.join(root, 'record.json'), 'utf8')).toBe(NEW);
    });

    whenQualified('reclaims orphaned temporaries through the directory item', () => {
      const orphan = '.fgv-atomic-0123456789abcdef01234567.tmp';
      fs.writeFileSync(path.join(root, orphan), 'half a record');
      const directory = DirectoryItem.create('.', accessors).orThrow();
      expect(directory.cleanupAtomicTemporaries()).toSucceedWith([orphan]);
      expect(fs.existsSync(path.join(root, orphan))).toBe(false);
    });
  });
});

describe('FsFileTreeAccessors atomic writes and mutability policy', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(atomicTestRoots()[0].base, 'fgv-atomic-policy-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('a read-only tree advertises no atomic replacement and refuses a write', () => {
    const accessors = new FsFileTreeAccessors({ prefix: root, mutable: false });
    expect(accessors.getAtomicWriteCapabilities(root)).toSucceedAndSatisfy((capabilities) => {
      expect(capabilities.atomicReplace).toBe(false);
      expect(capabilities.guarantees).toEqual([]);
    });
    // `not-writable`, the same code the in-memory store reports for the same
    // condition — one contract, one answer, whichever store is behind it.
    expect(
      accessors.writeFileAtomically(path.join(root, 'r.json'), NEW, { guarantee: 'process-crash' })
    ).toFailWithDetail(/mutability is disabled/i, {
      code: 'not-writable',
      stage: 'validate',
      visibility: 'unchanged'
    });
    expect(fs.readdirSync(root)).toEqual([]);
  });

  test('refuses a file the filter excludes even when its directory is writable', () => {
    // The directory qualifies and is mutable, so the refusal can only come from
    // the destination's own mutability check.
    const accessors = new FsFileTreeAccessors({
      prefix: root,
      // A RegExp, not a glob string: string patterns in an IFilterSpec are
      // substring matches, so '**/*.locked.json' would match nothing at all.
      mutable: { exclude: [/\.locked\.json$/] }
    });
    expect(accessors.getAtomicWriteCapabilities(root)).toSucceedAndSatisfy((capabilities) => {
      expect(capabilities.atomicReplace).toBe(isQualified(root));
    });
    expect(
      accessors.writeFileAtomically(path.join(root, 'secrets.locked.json'), NEW, {
        guarantee: 'process-crash'
      })
    ).toFailWithDetail(/excluded by filter/i, {
      code: 'not-writable',
      stage: 'validate',
      visibility: 'unchanged'
    });
    expect(fs.existsSync(path.join(root, 'secrets.locked.json'))).toBe(false);
  });

  test('a filter-excluded directory advertises no atomic replacement', () => {
    // The per-path mutability filter governs the atomic capability exactly as it
    // governs an ordinary save; a filtered path is not quietly writable because
    // a different method was used to reach it.
    fs.mkdirSync(path.join(root, 'locked'));
    const accessors = new FsFileTreeAccessors({
      prefix: root,
      // Likewise a RegExp. The earlier glob-shaped spelling excluded the
      // directory only incidentally — `include: ['**']` matched nothing, so
      // every path failed the include test rather than the exclude one, and the
      // assertion below would have held even with the exclude list removed.
      mutable: { exclude: [/\/locked(\/|$)/] }
    });
    expect(accessors.getAtomicWriteCapabilities(path.join(root, 'locked'))).toSucceedAndSatisfy(
      (capabilities) => {
        expect(capabilities.atomicReplace).toBe(false);
      }
    );
    expect(
      accessors.writeFileAtomically(path.join(root, 'locked', 'r.json'), NEW, {
        guarantee: 'process-crash'
      })
    ).toFailWithDetail(/excluded by filter/i, {
      code: 'not-writable',
      stage: 'validate',
      visibility: 'unchanged'
    });
  });

  test('a tree with no prefix has no root to be confined to', () => {
    // Confinement is defined relative to the prefix. With none there is no root,
    // and the check is vacuous rather than silently rejecting everything.
    const accessors = new FsFileTreeAccessors({ mutable: true });
    expect(accessors.getAtomicWriteCapabilities(root)).toSucceedAndSatisfy((capabilities) => {
      expect(capabilities.atomicReplace).toBe(isQualified(root));
    });

    if (isQualified(root)) {
      const target = path.join(root, 'unconfined.json');
      expect(accessors.writeFileAtomically(target, NEW, { guarantee: 'process-crash' })).toSucceed();
      expect(fs.readFileSync(target, 'utf8')).toBe(NEW);
      expect(accessors.cleanupAtomicTemporaries(root)).toSucceedWith([]);
    }
  });

  test('refuses an atomic write on a filesystem the allowlist does not name', () => {
    // A real unqualified filesystem rather than a simulated one: procfs is
    // always mounted on Linux, is a directory, and is emphatically not on the
    // allowlist. Nothing is written — the refusal happens before the protocol
    // starts — so pointing at /proc is safe.
    if (process.platform !== 'linux') {
      return;
    }
    const accessors = new FsFileTreeAccessors({ mutable: true });
    expect(accessors.getAtomicWriteCapabilities('/proc')).toSucceedAndSatisfy((capabilities) => {
      expect(capabilities.atomicReplace).toBe(false);
      expect(capabilities.guarantees).toEqual([]);
    });
    expect(
      accessors.writeFileAtomically('/proc/fgv-atomic-probe.json', NEW, { guarantee: 'process-crash' })
    ).toFailWithDetail(/atomic writes are not available here/i, {
      code: 'unsupported',
      stage: 'validate',
      visibility: 'unchanged'
    });
    expect(fs.existsSync('/proc/fgv-atomic-probe.json')).toBe(false);
  });

  test('the capability inquiry refuses a directory outside the tree root', () => {
    const accessors = new FsFileTreeAccessors({ prefix: root, mutable: true });
    expect(accessors.getAtomicWriteCapabilities(path.dirname(root))).toFailWith(
      /resolves outside the tree root/i
    );
  });
});
