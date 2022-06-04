import { MiddlewarePlugin, PluginManager } from '../../pluginManager.js';
import { getSystemPath, readFileFromPath, stat } from '../../utils.js';
import hljs from 'highlight.js';
import { renderPage } from '../../layoutManager.js';
import path from 'path';
import { isBinary } from 'istextorbinary';

interface IFileConfig {
  highlightTheme?: string;
  autoHighlight?: boolean;
  maxHighlightKb?: number;
  handleSvg?: boolean;
}

const MAX_TEXT_SIZE = 10 * 1024 * 1024; // 10MB

const file: MiddlewarePlugin<'textFile', IFileConfig> = async ({
  req,
  res,
  next,
  config,
}) => {
  if (req.method !== 'GET') return next();
  if (req.query.raw !== undefined) return next();

  if (req.path.endsWith('.svg') && !config.textFile?.handleSvg) return next();

  const systemPath = getSystemPath(req, config);
  if (req.query.download !== undefined) return res.download(systemPath);

  const stats = await stat(systemPath);
  if (!stats || stats.size > MAX_TEXT_SIZE) return next();

  const contentsBuffer = await readFileFromPath(systemPath);
  if (contentsBuffer === null || isBinary(null, contentsBuffer)) return next();

  const contents = contentsBuffer.toString();

  const maxHighlightSize = (config.textFile?.maxHighlightKb ?? 50) * 1000; // in kB

  const language =
    contents.length > maxHighlightSize
      ? 'text'
      : path.extname(req.path).substring(1).replace(/^txt$/, 'text') || 'text';

  const langSupported = !!hljs.getLanguage(language);
  let fileContentHtml;
  if (langSupported) {
    fileContentHtml = hljs.highlight(contents, { language }).value;
  } else {
    fileContentHtml = config.textFile?.autoHighlight
      ? hljs.highlightAuto(contents).value
      : contents;
  }

  const highlightTheme = config.textFile?.highlightTheme ?? 'default';

  const page = await renderPage(
    'textFile',
    req.path,
    { content: fileContentHtml, contentRaw: contents },
    { highlightTheme }
  );

  res.contentType('html');
  res.send(page);
};

PluginManager.register('textFile').withMiddleware(file);
