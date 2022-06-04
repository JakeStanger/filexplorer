import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { App } from './App.js';

export interface Config {
  hostname: string;
  port: number;
  cors: boolean;
  serveDirectory: string;
  baseUrl: string;
  caseSensitive: boolean;
  databasePath: string;
  plugins: string[];
}

const DEFAULT_CONFIG: Config = {
  hostname: '127.0.0.1',
  port: 5000,
  cors: false,
  serveDirectory: '.',
  baseUrl: '/',
  caseSensitive: true,
  databasePath: 'data.db',
  plugins: [
    'directoryListing',
    'appListing',
    'markdown',
    'textFile',
    'mediaFile',
    'raw',
    'upload',
    'scratchpad',
  ],
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

export async function loadConfig(overrides?: Partial<Config>): Promise<Config> {
  let config: Partial<Config> = {};
  for (const format of CONFIG_FORMATS) {
    const filename = `config.${format}`;
    if (await exists(filename)) {
      switch (format) {
        case 'js':
        case 'cjs':
        case 'mjs':
          config = await loadJavaScript(filename);
          break;
        case 'json':
          config = await loadJson(filename);
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

  return { ...DEFAULT_CONFIG, ...config, ...loadEnvironment(), ...overrides };
}

async function loadJavaScript(filename: string): Promise<Partial<Config>> {
  const filePath = path.join(App.basePath, filename);
  return import(filePath).then((m) => m.default);
}

async function loadJson(filename: string): Promise<Partial<Config>> {
  const filePath = path.join(App.basePath, filename);
  return import(filePath, { assert: { type: 'json' } }).then((m) => m.default);
}

async function loadYaml(filename: string): Promise<Partial<Config>> {
  const { parse } = await import('yaml');
  const file = await readFile(filename, 'utf-8');
  return parse(file);
}

async function loadToml(filename: string): Promise<Partial<Config>> {
  const { parse } = await import('toml');
  const file = await readFile(filename, 'utf-8');
  return parse(file);
}

async function loadCorn(filename: string): Promise<Partial<Config>> {
  const { parse } = await import('cornfig-wasm');
  const file = await readFile(filename, 'utf-8');
  return parse(file).value;
}

function loadEnvironment(): Partial<Config> {
  const config: Partial<Config> = {};

  if (process.env.HOSTNAME) config.hostname = process.env.HOSTNAME;
  if (process.env.PORT) config.port = parseInt(process.env.PORT);
  if (process.env.SERVE_DIRECTORY)
    config.serveDirectory = process.env.SERVE_DIRECTORY;
  if (process.env.DATABASE_PATH)
    config.databasePath = process.env.DATABASE_PATH;

  return config;
}
