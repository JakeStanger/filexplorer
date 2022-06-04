import { promises as fs } from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import { stat } from './utils.js';
import { PluginManager } from './pluginManager.js';
import { App } from './App.js';

const layoutFilePath = path.join(App.basePath, 'resources', 'layout.hbs');
const layoutFile = await fs.readFile(layoutFilePath, 'utf-8');
const layout = Handlebars.compile(layoutFile);

function getBreadcrumbs(path: string) {
  const pathSplit = path.split('/').slice(1);
  return pathSplit
    .filter((c) => c)
    .map((crumb, i) => ({
      name: crumb,
      url: '/' + pathSplit.slice(0, i + 1).join('/'),
    }));
}

export async function renderPage(
  pluginName: string,
  reqPath: string,
  contentProps: Record<string, unknown>,
  headProps: Record<string, unknown> = {}
) {
  reqPath = decodeURIComponent(reqPath);

  let basePath = path.join(App.basePath, 'resources', 'plugins', pluginName);

  const exists = !!(await stat(basePath));
  if (!exists) {
    basePath = path.join(PluginManager._importMap[pluginName], 'resources');
  }

  const contentFile = await fs.readFile(
    path.join(basePath, 'content.hbs'),
    'utf-8'
  );
  const content = Handlebars.compile(contentFile)(contentProps);

  let head = '';

  const headFilePath = path.join(basePath, 'head.hbs');
  const headExists = await stat(headFilePath);
  if (headExists) {
    const headFile = await fs.readFile(headFilePath, 'utf-8');
    head = Handlebars.compile(headFile)(headProps);
  }

  const breadcrumbs = getBreadcrumbs(reqPath);

  return layout({ head, content, title: reqPath, breadcrumbs });
}
