import {
  InitEvent,
  MiddlewarePlugin,
  PluginManager,
} from '../../pluginManager.js';
import multer from 'multer';
import path from 'path';
import { RequestHandler } from 'express';
import * as crypto from 'crypto';
import type { v4 as UUID } from 'uuid';
import type CUID from 'cuid';
import { renderPage } from '../../layoutManager.js';

interface IUploadConfig {
  maxFileSize?: number;
  authorization?: string;
  path?: string;
  nameScheme?: 'hex' | 'uuid' | 'cuid' | 'adjective-adjective-animal';
}

let uploadFile: RequestHandler;

let uuid: typeof UUID;
let cuid: typeof CUID;
let adjectives: string[];
let animals: string[];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const init: InitEvent<'upload', IUploadConfig> = async ({ config }) => {
  uploadFile = multer({
    storage: multer.diskStorage({
      destination: path.join(config.serveDirectory, config.upload?.path ?? '/'),
      filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        let filename: string;
        switch (config.upload?.nameScheme) {
          case 'uuid':
            filename = uuid();
            break;
          case 'cuid':
            filename = cuid();
            break;
          case 'adjective-adjective-animal':
            filename =
              randomElement(adjectives) +
              randomElement(adjectives) +
              randomElement(animals);
            break;
          case 'hex':
          default:
            filename = crypto.randomBytes(4).toString('hex');
        }

        cb(null, filename + extension);
      },
    }),
    limits: { fieldSize: config.upload?.maxFileSize },
  }).single('file');

  // Dynamically import right module(s) for naming scheme
  switch (config.upload?.nameScheme) {
    case 'uuid':
      uuid = await import('uuid').then((mod) => mod.v4);
      break;
    case 'cuid':
      cuid = await import('cuid').then((mod) => mod.default);
      break;
    case 'adjective-adjective-animal':
      adjectives = await import('./adjectives.json', {
        assert: { type: 'json' },
      }).then((mod) => mod.default);
      animals = await import('./animals.json', {
        assert: { type: 'json' },
      }).then((mod) => mod.default);
      break;
  }
};

const post: MiddlewarePlugin<'upload', IUploadConfig> = async ({
  req,
  res,
  next,
  config,
}) => {
  if (req.method !== 'POST') return next();

  if (
    config.upload?.authorization &&
    req.headers.authorization !== config.upload.authorization
  ) {
    res.status(403).send('Unauthorized');
    return;
  }

  const filePath = await new Promise<string>((resolve, reject) => {
    uploadFile(req, res, (err) => {
      if (err) return reject(err);
      if (!req.file) return reject('Missing file');
      resolve(req.file.path);
    });
  }).catch((err) => {
    res.status(500).send(err);
  });

  // response already sent in catch, don't continue
  if (!filePath) return;

  const host = `${req.protocol}://${
    req.headers?.host ?? `${config.hostname}:${process.env.PORT}`
  }`;
  const uploadUrl = new URL(path.join(config.baseUrl, filePath), host).href;

  res.status(201).send(uploadUrl);
};

const upload: MiddlewarePlugin<'upload', IUploadConfig> = async ({
  req,
  res,
  ...params
}) => {
  if (req.method === 'POST') return post({ req, res, ...params });

  const page = await renderPage('upload', req.originalUrl, {});
  res.send(page);
};

PluginManager.register('upload')
  .onInit(init)
  .withAppMiddleware(upload, '/upload');
