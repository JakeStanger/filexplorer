import {
  InitEvent,
  MiddlewarePlugin,
  PluginManager,
} from '../../pluginManager.js';
import { readFile } from '../../utils.js';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { renderPage } from '../../layoutManager.js';

interface IMarkdownConfig {
  highlight: boolean;
  highlightTheme: boolean;
  gfm: boolean;
}

const init: InitEvent<'markdown', IMarkdownConfig> = async ({ config }) => {
  const mdConfig = config.markdown;

  const options: marked.MarkedOptions = {
    renderer: new marked.Renderer(),
    pedantic: false,
    gfm: mdConfig?.gfm !== false,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false,
  };

  if (mdConfig?.highlight !== false) {
    options.langPrefix = 'hljs language-';
    options.highlight = (code, lang) => {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    };
  }

  marked.setOptions(options);
};

const markdown: MiddlewarePlugin<'markdown', IMarkdownConfig> = async ({
  req,
  res,
  next,
  config,
}) => {
  if (req.method !== 'GET') return next();
  if (!(req.path.endsWith('.md') || req.path.endsWith('.markdown')))
    return next();

  const contents = await readFile(req, config);
  if (contents === null) return next();

  const html = marked.parse(contents.toString());

  const highlightTheme = config.markdown?.highlightTheme ?? 'default';

  const page = await renderPage(
    'markdown',
    req.path,
    { html },
    { highlightTheme }
  );

  res.send(page);
};

PluginManager.register('markdown').onInit(init).withMiddleware(markdown);
