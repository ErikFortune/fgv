// Re-export the new adapter implementation that uses ts-res zip-archive packlet
export {
  ZipArchiveAdapter as BrowserZipLoader,
  createBrowserZipLoader,
  loadZipFile,
  loadZipFromUrl
} from './zipArchiveAdapter';
