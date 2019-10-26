'use strict';

const assert = require('assert');
const validator = require('html-validator');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { spawn } = require('child_process');
const { readFileSync, readdirSync } = require('fs');
let testFiles = [];

getHTMLFiles(['./docs/', './docs/posts/']);

function getHTMLFiles(paths) {
  for (let path of paths) {
    readdirSync(path)
      .filter(f => /\.html$/.test(f))
      .map(f => {
        testFiles.push(`${path}${f}`);
      });
  }
}

function buildIsh() {
  this.timeout(5000);
  return new Promise((res, rej) => {
    const build = spawn('./scripts/build.sh');
    build.on('close', (code) => {
      if (code > 0) {
        rej(new Error('BuildFailure: ' + code));
      } else {
        res();
      }
    });
  });
}

describe('HTML', function() {
  before(buildIsh);
  testFiles.forEach(f => {
    it(`${f}`, async function() {
      const options = {
        data: readFileSync(f, 'utf-8')
      };
      const { window } = new JSDOM(options.data);
      const result = await validator(options);
      const results = JSON.parse(result);
      const eLen = results.messages.filter(t => t.type === 'error').length;
      const iLen = results.messages.filter(t => t.type === 'info').length;
      if (eLen > 0) {
        console.dir(results.messages.filter(t => t.type === 'error'));
      }
      if (iLen > 0) {
        console.dir(results.messages.filter(t => t.type === 'info'));
      }
      const fTitle = f.replace(/.*\/([^/]+)$/, '$1')
        .replace(/\.html/, '')
        .replace(/_/g, ' ');

      console.log(`${f}:${fTitle}`);
      const title = /\/posts\//.test(f) ? `lineus.dev ${fTitle}`:'lineus.dev';
      assert.strictEqual(window.document.title, title);
      assert.strictEqual(eLen, 0, `There are ${eLen} Errors`);
      assert.strictEqual(iLen, 0, `There are ${iLen} Info Messages`);
    });
  });
});
