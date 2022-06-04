import { MiddlewarePlugin, PluginManager } from '../../pluginManager.js';
import { renderPage } from '../../layoutManager.js';

const appListing: MiddlewarePlugin<'appListing'> = async ({
  req,
  res,
  next,
}) => {
  // listening on root captures all child routes - we don't want these
  if (req.path !== '/') return next();

  const routes = PluginManager._appRoutes;
  const page = await renderPage('appListing', req.originalUrl, { routes });
  res.send(page);
};

PluginManager.register('appListing').withAppMiddleware(appListing, '/');
