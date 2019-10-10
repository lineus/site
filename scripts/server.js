#!/usr/bin/env node
'use strict';

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const port = 3000;

const map = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword'
};

http.createServer(function (req, res) {
  const parsedUrl = url.parse(req.url);
  let input = parsedUrl.pathname === '/' ? '/index.html':parsedUrl.pathname;
  let pName = `./docs${input.replace(/^(\.)+/, '.').replace(/^\/docs/, '')}`;
  const ext = path.parse(pName).ext || '.html';

  fs.exists(pName, function (exist) {
    if (!exist) {
      res.statusCode = 404;
      res.end(`File ${pName} not found!`);
      return;
    }

    if (fs.statSync(pName).isDirectory()) pName += '/index' + ext;

    fs.readFile(pName, function (err, data) {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        res.setHeader('Content-type', map[ext] || 'text/plain');
        res.end(data);
      }
    });
  });


}).listen(parseInt(port));
