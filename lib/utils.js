import path from 'path';
import { promises as fs } from 'fs';
/**
 * Resolves request path into path on disk.
 * @param req
 * @param config
 */
export function getSystemPath(req, config) {
    const relReqPath = req.path.substring(config.baseUrl.length);
    return path.join(config.serveDirectory, relReqPath);
}
/**
 * Gets fs stats for a path, or `null` if it does not exist.
 * @param path
 */
export async function stat(path) {
    return await fs.stat(path).catch(() => null);
}
//# sourceMappingURL=utils.js.map