import { error, info } from './logging.js';
export class PluginManager {
    constructor(app, router, internalRouter, config) {
        this.app = app;
        this.router = router;
        this.internalRouter = internalRouter;
        this.config = config;
        PluginManager._instance = this;
    }
    static get() {
        return this._instance;
    }
    async loadPlugins() {
        var _a, _b;
        for (const pluginName of this.config.plugins) {
            const resolutions = [`./plugins/${pluginName}/index.js`, pluginName];
            let success = false;
            for (const url of resolutions) {
                const res = await ((_b = (_a = import.meta).resolve) === null || _b === void 0 ? void 0 : _b.call(_a, url).catch(() => null));
                if (res) {
                    await import(url);
                    success = true;
                    break;
                }
            }
            if (success) {
                info(`Finished loading plugin ${pluginName}`, 'Init');
            }
            else {
                error(`Failed to load plugin ${pluginName}`, 'Init');
            }
        }
    }
    registerMiddleware(plugin, pluginName) {
        this.router.use((req, res, next) => plugin(req, res, next, this.config));
        info(`Added HTTP middleware ${pluginName} to main router`, 'info');
    }
    registerStylesheet(url, pluginName) { }
}
//# sourceMappingURL=pluginManager.js.map