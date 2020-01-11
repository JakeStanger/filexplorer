# Filebrowser

A web based file browser and pastebin-like service, with a lightweight front-end.

This is a small Express server with two endpoints. One serves the files and directory listings,
and the other saves files to disk. 

The page rendering is achieved using server-side React to utilise modern web components while 
still serving static pages. JavaScript is only required client-side for the copy to clipboard button.

## Features

- Directory listings.
- Renders markdown files using `react-markdown`.
- Syntax highlights text files using `react-syntax-highlighter` with `highlight.js`.
- Renders images.
- File types without special treatment (such as binary files) are served raw by the browser.
- Ability to view and download raw from browser.
- Ability to copy text to clipboard using `clipboard.js`.
- Only serves HTML to browsers - if `text/html` is not explicitly in the requested mimetypes, the raw file is provided.
- Saves uploaded files to a designated folder.

![screenshot](https://f.jstanger.dev/github/filebrowser/screenshot.png)

## Installation

- Clone this repo
- Copy `config.example.json` as `config.json` and tweak the values to your needs.
- Run `yarn install` to install dependencies.
- Run `yarn build` to compile the TypeScript.
    - You can use `yarn start` to test with. This will rebuild before starting.

## Uploading

You can upload files to the server by posting on `/upload`. The server will return the URL to the file.

```bash
$ curl -F 'file=@01.rs' http://localhost:5000/upload
http:/localhost:5000/pastes/d1713df8.rs
```

Some things to note:

- The request body is ignored. You must upload a file as form data.
- The file must be uploaded using the form key `file`.
- Only one file can be uploaded at a time.

## Configuration

- **basePath** - The absolute path to use as the root for the file browser.
- **uploadPath** - The relative path from the root to upload pastes to.
    - If you want to use this purely as a paste service, you can set this to `/`.
- **port** - The port to serve on.
- **maxUploadSize** - The maximum file size, in *bytes*, that can be uploaded.