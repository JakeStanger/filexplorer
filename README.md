# Filebrowser

A web based file browser and pastebin-like service, with a lightweight front-end.

This is a small Express server with two endpoints. One serves the files and directory listings,
and the other saves files to disk. 

The page rendering is achieved using server-side React to utilise modern web components while 
still serving static pages. JavaScript is only required client-side for the copy to clipboard button.

The idea for this very much came from [Deno](https://deno.land/) and [its file previewer](https://deno.land/std/examples/welcome.ts)
which works in the same way, pretty much using the same libraries and frameworks ([repo here](https://github.com/denoland/deno_website2)).

## Features

- Directory listings.
- Renders markdown files using `react-markdown`.
- Syntax highlights text files using `react-syntax-highlighter` with `highlight.js`.
- Renders images.
- File types without special treatment (such as binary files) are served raw by the browser.
- Ability to view and download raw from browser.
- Ability to copy text to clipboard using `clipboard.js`.
- Only serves HTML to browsers - if `text/html` is not explicitly in the requested mime types, the raw file is provided.
- Saves uploaded files to a designated folder.

![screenshot](https://f.jstanger.dev/github/filebrowser/screenshot.png)

## Uploading

You can upload files to the server by posting on `/`. The server will return the URL to the file.

```bash
$ curl -F 'file=@01.rs' http://localhost:5000
http://localhost:5000/pastes/d1713df8.rs
```

Some things to note:

- The request body is ignored. You must upload a file as form data.
- The file must be uploaded using the form key `file`.
- Only one file can be uploaded at a time.

## Installation

- Clone this repo
- Copy `config.example.json` as `config.json` and tweak the values to your needs.
- Run `yarn install` to install dependencies.
- Run `yarn build` to compile the TypeScript.
    - You can use `yarn start` to test with. This will rebuild before starting.

### Configuration

- **basePath** - The absolute path to use as the root for the file browser.
- **port** - The port to serve on.
- **allowUploads** - Whether uploading should be enabled. Disabling will cause `/upload` to `403`.
- **uploadAuth** - An expected value for the `Authorization` header. 
Leave blank to disable. When set, requests will `403` if the header does not match.
- **uploadPath** - The relative path from the root to upload pastes to. 
If you want to use this purely as a paste service, you can set this to `/`.
- **maxUploadSize** - The maximum file size, in *bytes*, that can be uploaded.
- **hostname** - The hostname *including protocol* being used to serve on. Used to create the returned upload link

### Systemd Service

If you want to run the server in the background and are using a systemd-based Linux distro this should help:

```ini
[Unit]
Description="NodeJS filebrowser"
Requires=network.target

[Service]
ExecStart=/usr/bin/node /path/to/repo
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=filebrowser

[Install]
WantedBy=multi-user.target
```

### Nginx configuration

If you want to make the server publically available, you should use a reverse proxy. If you are
using Nginx, the following should work:

> Of course you will need to change the root, server name, SSL certs and proxy port.

```nginx
server {
  listen 443;
  listen [::]:443;

  root /path/to/repo/public;

  server_name example.com;

  ssl_certificate /path/to/fullchain.pem;
  ssl_certificate_key /path/to/privkey.pem;

  location / {
    proxy_pass http://localhost:5000;
  }

  location ~ ^(/js)|(/css) {
     # do not proxy public js and css 
  }
}
```
