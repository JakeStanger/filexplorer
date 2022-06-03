import { Plugin, PluginManager } from '../../pluginManager.js';
import { getSystemPath, stat } from '../../utils.js';
import { promises as fs } from 'fs';
import mime from 'mime-types';
import path from 'path';

const raw: Plugin<'raw'> = async (req, res, next, config) => {
  const systemPath = getSystemPath(req, config);

  const isFile = await stat(systemPath).then((stat) => stat?.isFile());

  if (!isFile) return next();

  const contents = await fs.readFile(systemPath);

  const contentType = mime.contentType(path.basename(systemPath));
  if(contentType) {
    res.setHeader('Content-Type', contentType);
  }

  res.send(contents);
};

PluginManager.get().registerMiddleware(raw, 'raw');
