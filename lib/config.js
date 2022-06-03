import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
const DEFAULT_CONFIG = {
    hostname: '127.0.0.1',
    port: 5000,
    baseUrl: '/',
    caseSensitive: true,
    serveDirectory: '.',
    plugins: ['directoryListing', 'raw'],
};
/** Formats in order of preference */
const CONFIG_FORMATS = [
    'js',
    'cjs',
    'mjs',
    'json',
    'yaml',
    'yml',
    'toml',
    'corn',
];
const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
export async function loadConfig() {
    let config = {};
    for (const format of CONFIG_FORMATS) {
        const filename = `config.${format}`;
        if (await exists(filename)) {
            switch (format) {
                case 'js':
                case 'cjs':
                case 'mjs':
                    config = loadJavaScript(filename);
                    break;
                case 'json':
                    config = loadJson(filename);
                    break;
                case 'yaml':
                case 'yml':
                    config = await loadYaml(filename);
                    break;
                case 'toml':
                    config = await loadToml(filename);
                    break;
                case 'corn':
                    config = await loadCorn(filename);
                    break;
            }
            break;
        }
    }
    return { ...DEFAULT_CONFIG, ...config };
}
function loadJavaScript(filename) {
    const filePath = path.join(process.cwd(), filename);
    return require(filePath);
}
function loadJson(filename) {
    const filePath = path.join(process.cwd(), filename);
    return require(filePath);
}
async function loadYaml(filename) {
    const { parse } = await import('yaml');
    const file = await readFile(filename, 'utf-8');
    return parse(file);
}
async function loadToml(filename) {
    const { parse } = await import('toml');
    const file = await readFile(filename, 'utf-8');
    return parse(file);
}
async function loadCorn(filename) {
    const { parse } = await import('cornfig-wasm');
    const file = await readFile(filename, 'utf-8');
    return parse(file).value;
}
//# sourceMappingURL=config.js.map