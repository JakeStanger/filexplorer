import * as express from "express";
import * as ReactDom from "react-dom/server";
import * as React from "react";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from 'mkdirp';
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

dotenv.config();

function loggerMiddleware(
  request: express.Request,
  response: express.Response,
  next
) {
  console.log(`${request.method} ${request.path}`);
  next();
}

const app = express();
app.use(express.static(path.join(__dirname, "../", "public")));
app.use(loggerMiddleware);

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
      modified: pStat.mtime
    };
  });
}

app.get("*", (req, res) => {
  const relPath = decodeURIComponent(req.path);
  const fullPath = path.join(process.env.ROOT_PATH, relPath);

  if (!fs.existsSync(fullPath)) return res.status(404).send("Not found");

  const stat = fs.lstatSync(fullPath);

  let element: JSX.Element | string = "";

  let content;
  const isDirectory = stat.isDirectory();
  if (isDirectory) {
    const contents: IFileSystemObject[] = getDirectoryListings(fullPath);

    element = React.createElement(DirectoryList, {
      relPath,
      contents
    });
  } else {
    // Only send HTML if this is a browser explicitly asking for it.
    if (
      req.accepts().indexOf("text/html") === -1 ||
      (req.query && req.query["raw"] != undefined)
    )
      return res.sendFile(fullPath);

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
        element = React.createElement("img", { src: relPath });
      } else return res.sendFile(fullPath);
    }
  }

  const app = React.createElement(
    App,
    { relPath, content, isDirectory },
    element
  );

  const componentString = ReactDom.renderToStaticMarkup(app);

  return res.send(
    template({ element: componentString, title: path.basename(relPath) || "/" })
  );
});

app.post("/", upload.single("file"), async (req, res) => {
  if (process.env.ALLOW_UPLOADS === "false")
    return res.status(403).send("Uploads disabled");
  if (
    process.env.UPLOAD_AUTH &&
    req.header("Authorization") !== process.env.UPLOAD_AUTH
  )
    return res.status(403).send("Invalid auth header");

  const extension = path.extname(req.file.originalname);
  const filename = crypto.randomBytes(4).toString("hex") + extension;

  const relPath = path.join(process.env.UPLOAD_PATH, filename);
  const fullPath = path.join(process.env.ROOT_PATH, relPath);

  mkdirp.sync(path.dirname(fullPath));
  fs.writeFileSync(fullPath, req.file.buffer);

  return res.status(200).send(`${process.env.HOSTNAME}${relPath}`);
});

app.listen(process.env.PORT);
