import { MiddlewarePlugin, PluginManager } from '../../pluginManager.js';
import { getSystemPath, stat } from '../../utils.js';
import { promises as fs } from 'fs';
import { DateTime } from 'luxon';
import path from 'path';
import { renderPage } from '../../layoutManager.js';

interface IDirectoryListingConfig {
  showHidden?: boolean;
  relativeDates?: boolean;
}

interface IFileSystemObject {
  name: string;
  size: string;
  isDirectory: boolean;
  created: string;
  modified: string;
}

function bytesToSize(bytes: number) {
  const sizes = ['B', 'kB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Bytes';
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1000))));
  return (bytes / Math.pow(1000, i)).toPrecision(3) + ' ' + sizes[i];
}

async function getDirectoryListings(
  systemPath: string,
  basePath: string,
  config?: IDirectoryListingConfig
): Promise<IFileSystemObject[]> {
  const items = await fs.readdir(systemPath);
  const relativeDates = config?.relativeDates !== false;

  return await Promise.all(
    items
      .filter((item) => config?.showHidden || !item.startsWith('.'))
      .map(async (p) => {
        const pStat = await fs.lstat(path.join(systemPath, p));

        const isDirectory = pStat.isDirectory();

        const createdDate = DateTime.fromJSDate(pStat.birthtime);
        const modifiedDate = DateTime.fromJSDate(pStat.mtime);

        return {
          name: p,
          url: path.join(basePath, p),
          size: !isDirectory ? bytesToSize(pStat.size) : '-',
          created: relativeDates
            ? (createdDate.toRelative() as string)
            : createdDate.toLocaleString(DateTime.DATETIME_SHORT),
          modified: relativeDates
            ? (modifiedDate.toRelative() as string)
            : modifiedDate.toLocaleString(DateTime.DATETIME_SHORT),
          isDirectory,
        };
      })
  ).then((items) =>
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (b.isDirectory && !a.isDirectory) return 1;

      return a.name.localeCompare(b.name);
    })
  );
}

const directoryListing: MiddlewarePlugin<
  'directoryListing',
  IDirectoryListingConfig
> = async ({ req, res, next, config }) => {
  if (req.method !== 'GET') return next();

  const systemPath = getSystemPath(req, config);

  const isDir = await stat(systemPath).then((stat) => stat?.isDirectory());

  if (!isDir) return next();

  const items = await getDirectoryListings(
    systemPath,
    req.path,
    config.directoryListing
  );

  const page = await renderPage('directoryListing', req.path, { items });

  res.contentType('html');
  res.send(page);
};

PluginManager.register('directoryListing').withMiddleware(directoryListing);
