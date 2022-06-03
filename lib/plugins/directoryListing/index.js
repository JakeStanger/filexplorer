import { PluginManager } from '../../pluginManager.js';
import { getSystemPath, stat } from '../../utils.js';
import { promises as fs } from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import * as url from 'url';
function getBreadcrumbs(path) {
    const pathSplit = path.split('/').slice(1);
    return pathSplit
        .filter((c) => c)
        .map((crumb, i) => ({
        name: crumb,
        url: '/' + pathSplit.slice(0, i + 1).join('/'),
    }));
}
const directoryListing = async (req, res, next, config) => {
    const systemPath = getSystemPath(req, config);
    const isDir = await stat(systemPath).then((stat) => stat === null || stat === void 0 ? void 0 : stat.isDirectory());
    if (!isDir)
        return next();
    const breadcrumbs = getBreadcrumbs(req.path);
    const items = await fs
        .readdir(systemPath)
        .then((items) => items
        .filter((item) => { var _a; return ((_a = config.directoryListing) === null || _a === void 0 ? void 0 : _a.showHidden) || !item.startsWith('.'); })
        .map((i) => ({ name: i, url: path.join(req.path, i) })));
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
    // TODO: Move
    const layout = await fs.readFile('templates/layout.hbs', 'utf-8');
    const layoutTemplate = Handlebars.compile(layout);
    const headTemplateContent = await fs.readFile(path.join(__dirname, 'head.hbs'), 'utf-8');
    const head = Handlebars.compile(headTemplateContent)({});
    const contentTemplate = await fs.readFile(path.join(__dirname, 'content.hbs'), 'utf-8');
    const template = Handlebars.compile(contentTemplate);
    const content = template({ items, breadcrumbs });
    const page = layoutTemplate({ head, content });
    res.contentType('html');
    res.send(page);
};
PluginManager.get().registerMiddleware(directoryListing, 'directoryListing');
//# sourceMappingURL=index.js.map