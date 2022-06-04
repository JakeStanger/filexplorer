import { Request } from 'express';
import { Config } from './config.js';
import path from 'path';
import { promises as fs, Stats } from 'fs';
import { Buffer } from 'buffer';

/**
 * Resolves request path into path on disk.
 * @param req
 * @param config
 */
export function getSystemPath(req: Request, config: Config) {
  const relReqPath = decodeURIComponent(req.path).substring(
    config.baseUrl.length
  );
  return path.join(config.serveDirectory, relReqPath);
}

/**
 * Gets fs stats for a path, or `null` if it does not exist.
 * @param path
 */
export async function stat(path: string): Promise<Stats | null> {
  return await fs.stat(path).catch(() => null);
}

/**
 * Reads a requested file as utf-8 string.
 *
 * Returns null if the path is not a file
 * @param req
 * @param config
 */
export async function readFile(
  req: Request,
  config: Config
): Promise<Buffer | null> {
  const systemPath = getSystemPath(req, config);
  return await readFileFromPath(systemPath);
}

export async function readFileFromPath(
  systemPath: string
): Promise<Buffer | null> {
  const isFile = await stat(systemPath).then((stat) => stat?.isFile());
  if (!isFile) return null;

  return await fs.readFile(systemPath);
}
