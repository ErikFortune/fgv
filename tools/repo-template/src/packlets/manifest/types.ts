/**
 * Types for the sync-manifest.json file.
 */

export interface ISharedFile {
  description: string;
  source: string;
  destination: string;
}

export interface ISharedPackage {
  description: string;
  source: string;
  destination: string;
}

export interface ITemplatedFile {
  description: string;
  template: string;
  destination: string;
}

export interface IManifest {
  shared: {
    description: string;
    files: ISharedFile[];
  };
  sharedPackages: {
    description: string;
    packages: ISharedPackage[];
  };
  templated: {
    description: string;
    files: ITemplatedFile[];
  };
}
