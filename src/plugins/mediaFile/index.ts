import { MiddlewarePlugin, PluginManager } from '../../pluginManager.js';
import { getSystemPath, stat } from '../../utils.js';
import mime from 'mime-types';
import { renderPage } from '../../layoutManager.js';

const mediaFile: MiddlewarePlugin<'mediaFile'> = async ({
  req,
  res,
  next,
  config,
}) => {
  if (req.method !== 'GET') return next();
  if (req.query.raw !== undefined) return next();

  const systemPath = getSystemPath(req, config);
  if (req.query.download !== undefined) return res.download(systemPath);

  const mimeType = mime.lookup(systemPath);
  if (!mimeType) return next();

  const exists = await stat(systemPath);
  if (!exists) return next();

  let page: string;
  if (mimeType.startsWith('image/')) {
    page = await renderPage('mediaFile', req.path, {
      image: req.path + '?raw',
    });
  } else if (mimeType.startsWith('video/')) {
    page = await renderPage('mediaFile', req.path, {
      video: req.path + '?raw',
    });
  } else if (mimeType.startsWith('audio/')) {
    page = await renderPage('mediaFile', req.path, {
      audio: req.path + '?raw',
    });
  } else {
    return next();
  }

  res.contentType('html');
  res.send(page);
};

PluginManager.register('mediaFile').withMiddleware(mediaFile);
