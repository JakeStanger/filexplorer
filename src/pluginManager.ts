import { Config } from './config.js';
import { error, info } from './logging.js';
import { Express, NextFunction, Request, Response, Router } from 'express';

export type Plugin<TName extends string, TConfig = Record<string, unknown>> = (
  req: Request,
  res: Response,
  next: NextFunction,
  config: Config & { [Key in TName]?: TConfig }
) => Promise<void>;

interface IPluginManager {
  registerMiddleware: <TName extends string, TConfig>(
    plugin: Plugin<TName, TConfig>,
    name: string
  ) => void;
}

export class PluginManager implements IPluginManager {
  private static _instance: PluginManager;

  constructor(
    private app: Express,
    private router: Router,
    private internalRouter: Router,
    private config: Config
  ) {
    PluginManager._instance = this;
  }

  public static get(): IPluginManager {
    return this._instance;
  }

  public async loadPlugins() {
    for (const pluginName of this.config.plugins) {
      const resolutions = [`./plugins/${pluginName}/index.js`, pluginName];

      let success = false;
      for (const url of resolutions) {
        const res = await import.meta.resolve?.(url).catch(() => null);
        if (res) {
          await import(url);
          success = true;
          break;
        }
      }

      if (success) {
        info(`Finished loading plugin ${pluginName}`, 'Init');
      } else {
        error(`Failed to load plugin ${pluginName}`, 'Init');
      }
    }
  }

  public registerMiddleware<TName extends string, TConfig>(
    plugin: Plugin<TName, TConfig>,
    pluginName: string
  ) {
    this.router.use((req, res, next) =>
      plugin(
        req,
        res,
        next,
        this.config as Config & { [Key in TName]?: TConfig }
      )
    );
    info(`Added HTTP middleware ${pluginName} to main router`, 'info');
  }

  public registerStylesheet(url: string, pluginName: string) {}
}
