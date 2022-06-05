#!/usr/bin/env -S node --experimental-wasm-modules --experimental-import-meta-resolve

import args from 'args';
import { App } from './App.js';

const DEFAULT_PLUGINS = [
  'directoryListing',
  'markdown',
  'textFile',
  'mediaFile',
  'raw',
];

args
  .option('hostname', 'The host address to bind to')
  .option('port', 'The port to bind to')
  .option('serveDirectory', 'The path to the directory on disk to serve')
  .option(
    'plugins',
    'The plugins to load, comma separated list',
    DEFAULT_PLUGINS.join(',')
  );

const flags = args.parse(process.argv, {
  version: false,
} as never);

if (flags.plugins) {
  flags.plugins = flags.plugins.split(',');
}

App.init(flags).catch(console.error);
