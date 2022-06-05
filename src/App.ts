import express, { Express, Router } from 'express';
import { Server } from 'socket.io';
import { Config, loadConfig } from './config.js';
import { Database, open } from 'sqlite';
import http from 'http';
import { debug, httpLogger, info } from './logging.js';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { PluginConfig, PluginManager } from './pluginManager.js';
import path from 'path';

export class App {
  /**
   * Root path on disk of this package - used for resolving resources.
   * NOTE: This assumes that this file is located in the root of `src`
   * */
  public static readonly basePath = path.dirname(
    path.dirname(new URL(import.meta.url).pathname)
  );

  public static server: http.Server;
  public static app: Express;
  public static router: Router;
  public static appRouter: Router;
  public static io: Server;
  public static config: Config;
  public static db: Database;

  public static async init(configOverrides?: Partial<Config>) {
    info('Starting app', 'Init');
    const config = await loadConfig(configOverrides);

    const { baseUrl, caseSensitive } = config;

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);

    const router = express.Router({ caseSensitive });
    const appRouter = express.Router();

    app.use(httpLogger);

    if (config.cors) {
      app.use(cors());
    }

    app.use(baseUrl, router);
    router.use('/_', appRouter);

    // only serve html for browsers
    router.use((req, res, next) => {
      if(!req.accepts().includes('text/html')) {
        return express.static(config.serveDirectory)(req, res, next);
      }

      return next();
    });

    appRouter.use(express.static(path.join(App.basePath, 'public')));

    const db = await open({
      filename: config.databasePath,
      driver: sqlite3.cached.Database,
    });

    App.server = server;
    App.app = app;
    App.router = router;
    App.appRouter = appRouter;
    App.io = io;
    App.config = config;
    App.db = db;

    await PluginManager._loadPlugins();

    await Promise.all(
      Object.keys(PluginManager._initEvents).map(async (plugin) => {
        await PluginManager._initEvents[plugin]({
          db,
          io,
          config: config as PluginConfig<string, unknown>,
        });
        debug(`Completed init hook for plugin ${plugin}`, 'Init');
      })
    );

    // synchronous, don't want to cause db problems
    for (const table of Object.keys(PluginManager._dbTables)) {
      await db.exec(PluginManager._dbTables[table]);
      debug(`Ensured table ${table} exists in database`, 'Init');
    }

    info('Loaded the following plugins:', 'Init');
    App.config.plugins.forEach((plugin) => {
      info(`- ${plugin}`, 'Init');
    });

    server.listen(config.port, config.hostname, () =>
      info(`Listening on http://${config.hostname}:${config.port}`, 'Init')
    );
  }
}
