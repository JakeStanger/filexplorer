import { Plugin, PluginManager } from '../../pluginManager.js';
import { getSystemPath, stat } from '../../utils.js';
import { promises as fs } from 'fs';

import Handlebars from 'handlebars';
import path from 'path';
import * as url from 'url';

interface IDirectoryListingConfig {
  showHidden?: boolean;
}

function getBreadcrumbs(path: string) {
  const pathSplit = path.split('/').slice(1);
  return pathSplit
    .filter((c) => c)
    .map((crumb, i) => ({
      name: crumb,
      url: '/' + pathSplit.slice(0, i + 1).join('/'),
    }));
}

const directoryListing: Plugin<'directoryListing', IDirectoryListingConfig> = async (
  req,
  res,
  next,
  config
) => {
  const systemPath = getSystemPath(req, config);

  const isDir = await stat(systemPath).then((stat) => stat?.isDirectory());

  if (!isDir) return next();

  const breadcrumbs = getBreadcrumbs(req.path);

  const items = await fs
    .readdir(systemPath)
    .then((items) =>
      items
        .filter((item) => config.directoryListing?.showHidden || !item.startsWith('.'))
        .map((i) => ({ name: i, url: path.join(req.path, i) }))
    );

  const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

  // TODO: Move
  const layout = await fs.readFile('templates/layout.hbs', 'utf-8');
  const layoutTemplate = Handlebars.compile(layout);

  const headTemplateContent = await fs.readFile(
    path.join(__dirname, 'head.hbs'),
    'utf-8'
  );
  const head = Handlebars.compile(headTemplateContent)({});

  const contentTemplate = await fs.readFile(
    path.join(__dirname, 'content.hbs'),
    'utf-8'
  );
  const template = Handlebars.compile(contentTemplate);

  const content = template({ items, breadcrumbs });
  const page = layoutTemplate({ head, content });

  res.contentType('html');
  res.send(page);
};

PluginManager.get().registerMiddleware(directoryListing, 'directoryListing');
