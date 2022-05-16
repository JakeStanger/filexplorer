import * as express from "express";
import * as morgan from "morgan";
import * as cors from "cors";
import * as ReactDom from "react-dom/server";
import * as React from "react";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as handlebars from "handlebars";
import * as multer from "multer";
import * as crypto from "crypto";
import IFileSystemObject from "./IFileSystemObject";
import DirectoryList from "./components/directoryList/DirectoryList";
import App from "./components/App";
import { lookup } from "mime-types";
import { isTextSync } from "istextorbinary";
import CodeBlock from "./components/codeBlock/CodeBlock";
import Markdown from "./components/markdown/Markdown";
import * as dotenv from "dotenv";
import { request } from "express";

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? "/";

const app = express();
app.use(BASE_URL, express.static(path.join(__dirname, "../", "public"))); // FIXME: Doesn't work with different base URL or nginx problem
app.use( morgan('short'));
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fieldSize: parseInt(process.env.MAX_UPLOAD_SIZE) }
});

const templateString = fs
  .readFileSync(path.join(__dirname, "../", "templates", "page.html"))
  .toString();
const template = handlebars.compile(templateString);

function getDirectoryListings(fullPath: string): IFileSystemObject[] {
  return fs.readdirSync(fullPath).map(p => {
    const pStat = fs.lstatSync(path.join(fullPath, p));

    return {
      name: p,
      size: pStat.size,
      isDirectory: pStat.isDirectory(),
      permissions: pStat.mode,
      created: pStat.ctime,
      modified: pStat.mtime,
      hidden: /(^|\/)\.[^\/.]/g.test(p)
    };
  });
}

app.get(`${BASE_URL}*`, (req, res) => {
  const relUrl = decodeURIComponent(req.path);
  const relPath = relUrl.substring(BASE_URL.length);
  const fullPath = path.join(process.env.ROOT_PATH, relPath);

  if (!fs.existsSync(fullPath)) return res.status(404).send("Not found");

  const stat = fs.lstatSync(fullPath);

  let element: JSX.Element | string = "";

  let content;
  const isDirectory = stat.isDirectory();
  if (isDirectory) {
    if(process.env.DISABLE_DIR_LISTINGS) {
      return res.status(403).send("Forbidden");
    }

    const contents: IFileSystemObject[] = getDirectoryListings(fullPath).filter(p => !p.hidden);

    element = React.createElement(DirectoryList, {
      relPath: relUrl,
      contents
    });
  } else {
    // Only send HTML if this is a browser explicitly asking for it.
    if (
      req.accepts().indexOf("text/html") === -1 ||
      (req.query && req.query["raw"] != undefined)
    ) {
      return res.sendFile(relPath, { root: process.env.ROOT_PATH });
    }

    if (req.query["download"] != undefined) return res.download(fullPath);

    const mimeType: string = lookup(req.path) || "";

    const contentBuffer = fs.readFileSync(fullPath);
    const isText = isTextSync(fullPath, contentBuffer);

    const MAX_TEXT_SIZE = 5 * 1_000_000; // 5 MB
    if (isText && stat.size < MAX_TEXT_SIZE) {
      content = contentBuffer.toString();

      if (mimeType !== "text/markdown") {
        const MAX_HIGHLIGHT_SIZE = 200 * 1000; // 200 kB;

        const language =
          stat.size > MAX_HIGHLIGHT_SIZE
            ? "text"
            : path
                .extname(relPath)
                .substr(1)
                .replace(/^txt$/, "text") || "text";

        element = React.createElement(CodeBlock, {
          content,
          language
        });
      } else {
        element = React.createElement(Markdown, { content });
      }
    } else {
      if (mimeType.indexOf("image/") > -1) {
        element = React.createElement("img", { src: relUrl });
      } else return res.sendFile(fullPath);
    }
  }

  const app = React.createElement(
    App,
    { relPath: relUrl, content, isDirectory },
    element
  );

  const componentString = ReactDom.renderToStaticMarkup(app);

  return res.send(
    template({ element: componentString, title: path.basename(relPath) || "/", BASE_URL })
  );
});

app.post(BASE_URL, upload.single("file"), async (req, res) => {
  if (process.env.ALLOW_UPLOADS === "false")
    return res.status(403).send("Uploads disabled");
  if (
    process.env.UPLOAD_AUTH &&
    req.header("Authorization") !== process.env.UPLOAD_AUTH
  )
    return res.status(403).send("Invalid auth header");


  if(!req.file) {
    return res.status(400).send("Missing file");
  }

  const extension = path.extname(req.file.originalname);
  const filename = crypto.randomBytes(4).toString("hex") + extension;

  const relPath= path.join(process.env.UPLOAD_PATH, filename);
  const relUrl = path.join(BASE_URL, relPath);
  const fullPath = path.join(process.env.ROOT_PATH, relPath);

  mkdirp.sync(path.dirname(fullPath));
  fs.writeFileSync(fullPath, req.file.buffer);

  const host = request.headers?.host ?? process.env.DEFAULT_HOST ?? `http://localhost:${process.env.PORT}`;
  return res.status(200).send(`${host}${relUrl}`);
});

app.listen(process.env.PORT);
console.log(`filebrowser started on http://localhost:${process.env.PORT}`);
