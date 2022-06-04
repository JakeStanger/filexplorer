import { MiddlewarePlugin, PluginManager } from '../../pluginManager.js';
import mime from 'mime-types';
import path from 'path';
import { isText } from 'istextorbinary';
import express from 'express';
import { readFileSync, Stats } from 'fs';

const MAX_TEXT_SIZE = 10 * 1024 * 1024; // 10MB

const raw: MiddlewarePlugin<'raw'> = async ({ req, res, next, config }) => {
  return express.static(config.serveDirectory, {
    setHeaders: (res, systemPath, stats: Stats) => {
      let contentType = mime.contentType(path.basename(req.path));
      if (!contentType) {
        if (stats.size < MAX_TEXT_SIZE) {
          // express does not support async here
          const buffer = readFileSync(systemPath);
          contentType = isText(null, buffer)
            ? 'text/plain'
            : 'application/octet-stream';
        } else {
          contentType = 'application/octet-stream';
        }
      }
      res.setHeader('Content-Type', contentType);
    },
  })(req, res, next);
};

PluginManager.register('raw').withMiddleware(raw);
