// Type declarations for File System Access API
// Based on https://wicg.github.io/file-system-access/

declare global {
  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
    isSameEntry(other: FileSystemHandle): Promise<boolean>;
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    getFile(): Promise<File>;
    createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    getDirectoryHandle(
      name: string,
      options?: FileSystemGetDirectoryOptions
    ): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
    removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
    keys(): AsyncIterableIterator<string>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
  }

  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
  }

  interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean;
  }

  interface FileSystemGetDirectoryOptions {
    create?: boolean;
  }

  interface FileSystemGetFileOptions {
    create?: boolean;
  }

  interface FileSystemRemoveOptions {
    recursive?: boolean;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: BufferSource | Blob | string): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }

  interface ShowDirectoryPickerOptions {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: FileSystemHandle | WellKnownDirectory;
  }

  interface ShowOpenFilePickerOptions {
    multiple?: boolean;
    excludeAcceptAllOption?: boolean;
    types?: FilePickerAcceptType[];
    startIn?: FileSystemHandle | WellKnownDirectory;
  }

  interface ShowSaveFilePickerOptions {
    excludeAcceptAllOption?: boolean;
    types?: FilePickerAcceptType[];
    startIn?: FileSystemHandle | WellKnownDirectory;
    suggestedName?: string;
  }

  interface FilePickerAcceptType {
    description: string;
    accept: Record<string, string[]>;
  }

  type WellKnownDirectory = 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';

  interface Window {
    showDirectoryPicker(options?: ShowDirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker(options?: ShowOpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(options?: ShowSaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}

export {};
