import { Request } from 'express';
import { Config } from './config.js';
import path from 'path';
import { promises as fs, Stats } from 'fs';

/**
 * Resolves request path into path on disk.
 * @param req
 * @param config
 */
export function getSystemPath(req: Request, config: Config) {
  const relReqPath = req.path.substring(config.baseUrl.length);
  return path.join(config.serveDirectory, relReqPath);
}

/**
 * Gets fs stats for a path, or `null` if it does not exist.
 * @param path
 */
export async function stat(path: string): Promise<Stats | null> {
  return await fs.stat(path).catch(() => null);
}
