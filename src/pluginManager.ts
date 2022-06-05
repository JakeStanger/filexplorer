import { Config } from './config.js';
import { debug, error, info } from './logging.js';
import express, { NextFunction, Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { App } from './App.js';
import { Database } from 'sqlite';
import path from 'path';

export type PluginConfig<
  TName extends string,
  TConfig = Record<string, unknown>
> = Config & { [Key in TName]?: TConfig };

interface BasePluginParams<
  TName extends string,
  TConfig = Record<string, unknown>
> {
  io: Server;
  db?: Database;
  config: PluginConfig<TName, TConfig>;
}

export type InitEvent<
  TName extends string,
  TConfig = Record<string, unknown>
> = (params: BasePluginParams<TName, TConfig>) => void | Promise<void>;

export interface MiddlewareParams<
  TName extends string,
  TConfig = Record<string, unknown>
> extends BasePluginParams<TName, TConfig> {
  req: Request;
  res: Response;
  next: NextFunction;
}

export type MiddlewarePlugin<
  TName extends string,
  TConfig = Record<string, unknown>
> = (params: MiddlewareParams<TName, TConfig>) => void | Promise<void>;

export interface WebsocketParams<
  TName extends string,
  TConfig = Record<string, unknown>
> extends BasePluginParams<TName, TConfig> {
  socket: Socket;
}

export type WebsocketPlugin<
  TName extends string,
  TConfig = Record<string, unknown>
> = (params: WebsocketParams<TName, TConfig>) => void | Promise<void>;

interface IPluginManager {
  onInit: <TName extends string, TConfig>(
    func: InitEvent<TName, TConfig>
  ) => this;

  withMiddleware: <TName extends string, TConfig>(
    func: MiddlewarePlugin<TName, TConfig>
  ) => this;

  withAppMiddleware: <TName extends string, TConfig>(
    func: MiddlewarePlugin<TName, TConfig>,
    route: string
  ) => this;

  withSocketIO: <TName extends string, TConfig>(
    func: WebsocketPlugin<TName, TConfig>
  ) => this;

  withDatabaseTable: (
    tableName: string,
    schema: Record<string, string>
  ) => this;
}

export class PluginManager implements IPluginManager {
  public static readonly _importMap: Record<string, string> = {};
  public static readonly _initEvents: Record<
    string,
    InitEvent<string, unknown>
  > = {};
  public static readonly _dbTables: Record<string, string> = {};
  public static readonly _appRoutes: string[] = [];

  private readonly _pluginName: string;

  private constructor(pluginName: string) {
    this._pluginName = pluginName;
  }

  public static register(name: string): IPluginManager {
    return new PluginManager(name);
  }

  public static async _loadPlugins() {
    if(typeof import.meta.resolve !== 'function') {
      throw new Error('You must pass flag `--experimental-import-meta-resolve` to node to be able to resolve plugins');
    }

    for (const pluginName of App.config.plugins) {
      const resolutions = [`./plugins/${pluginName}/index.js`, pluginName];

      let success = false;
      for (const url of resolutions) {
        const res = await import.meta.resolve?.(url).catch(() => null);
        if (res) {
          await import(url);

          // keep track of plugin locations for later use
          this._importMap[pluginName] = path.dirname(new URL(res).pathname);
          success = true;
          break;
        }
      }

      if (success) {
        debug(`Finished loading plugin ${pluginName}`, 'Init');
      } else {
        error(`Failed to load plugin ${pluginName}`, 'Init');
      }
    }
  }

  public onInit<TName extends string, TConfig>(
    config: InitEvent<TName, TConfig>
  ) {
    PluginManager._initEvents[this._pluginName] = config as InitEvent<
      string,
      unknown
    >;

    return this;
  }

  public withMiddleware<TName extends string, TConfig>(
    plugin: MiddlewarePlugin<TName, TConfig>
  ) {
    App.router.use((req, res, next) =>
      plugin({
        req,
        res,
        next,
        io: App.io,
        db: App.db,
        config: App.config as PluginConfig<TName, TConfig>,
      })
    );
    debug(`Added HTTP middleware ${this._pluginName} to main router`, 'info');

    return this;
  }

  public withAppMiddleware<TName extends string, TConfig>(
    plugin: MiddlewarePlugin<TName, TConfig>,
    route: string
  ) {
    const router = express.Router();
    App.appRouter.use(route, router);
    router.use((req, res, next) =>
      plugin({
        req,
        res,
        next,
        io: App.io,
        db: App.db,
        config: App.config as PluginConfig<TName, TConfig>,
      })
    );

    // only include top-level routes here
    if (route.length > 1 && !route.includes('/', 1)) {
      PluginManager._appRoutes.push(route.substring(1));
    }

    debug(`Added HTTP middleware ${this._pluginName} to app router`, 'info');

    return this;
  }

  public withSocketIO<TName extends string, TConfig>(
    plugin: WebsocketPlugin<TName, TConfig>
  ) {
    App.io.on('connection', (socket) => {
      plugin({
        socket,
        io: App.io,
        db: App.db,
        config: App.config as PluginConfig<TName, TConfig>,
      });
    });

    debug(
      `Added Websocket middleware ${this._pluginName} to app router`,
      'info'
    );

    return this;
  }

  public withDatabaseTable(tableName: string, schema: Record<string, string>) {
    const schemaString = Object.keys(schema)
      .map((name) => `${name} ${schema[name]}`)
      .join(', ');

    const query = `CREATE TABLE IF NOT EXISTS ${this._pluginName} (${schemaString})`;
    PluginManager._dbTables[tableName] = query;

    return this;
  }
}
