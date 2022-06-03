import express from 'express';
import { loadConfig } from './config.js';
import { httpLogger, info } from './logging.js';
import { PluginManager } from './pluginManager.js';
async function init() {
    const config = await loadConfig();
    const { baseUrl, caseSensitive } = config;
    const app = express();
    const router = express.Router({ caseSensitive });
    const internalRouter = express.Router();
    app.use(httpLogger);
    app.use(baseUrl, router);
    router.use('/_', internalRouter);
    internalRouter.use(express.static('public'));
    await new PluginManager(app, router, internalRouter, config).loadPlugins();
    app.listen(config.port, config.hostname, () => info(`Listening on http://${config.hostname}:${config.port}`, 'Init'));
}
init().catch(console.error);
//# sourceMappingURL=index.js.map