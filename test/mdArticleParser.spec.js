'use strict';

const assert = require('assert');
const { MDArticle } = require('../lib/MDArticle');
const { openSync, promises } = require('fs');
const { readFile } = promises;

const expectedSynopsis = `
This is my parser.
This is my gun.
This is for parsing.
This is for fun.
`;

const expectedTags = [
  'one',
  'two',
  'buckle',
  'myshoe',
  'three',
  'four',
  'shut',
  'thedoor'
];

const eLinks = [
  'yay!',
  'who?',
  'yahoo',
  'newline',
  'evil',
  'people',
  'google',
  'wasted',
  'time',
  'reddit'
];

const n = '# test';

const y = `
<!--Published: 1571409402365-->
<!--Updated: 1571419390214-->
`;

const f = `
<!--Published: 4725093192045-->
<!--Updated: 4725093192045-->
`;

const yParser = new MDArticle({ md: y });
yParser.parse();
const nParser = new MDArticle({ md: n });
nParser.parse();
const fParser = new MDArticle({ md: f });
fParser.parse();

describe('mdParser', function() {
  let md;
  const fh = openSync('./test/stub/no_synopsis.md');
  const pt = './test/stub/yet_another.md';
  let withData;
  describe('smoketests', function() {
    it('is a function', function() {
      assert.ok(typeof MDArticle === 'function');
    });

    it('returns an instance with/without new', function() {
      const i1 = new MDArticle();
      assert.ok(i1 instanceof MDArticle);
      const i2 = MDArticle();
      assert.ok(i2 instanceof MDArticle);
      assert.notStrictEqual(i1, i2);
    });
  });
  describe('options', function() {
    before(async function() {
      md = await readFile('./test/stub/test_icicle.md', 'utf-8');
    });
    it('takes a file object', function() {
      const parser = new MDArticle({ file: fh });
      assert.ok(parser.mdString);
      assert.equal(typeof parser.mdString, 'string');
    });
    it('takes a path to a file', function() {
      const parser = new MDArticle({ path: pt });
      assert.ok(parser.mdString);
      assert.equal(typeof parser.mdString, 'string');
    });
    it('takes a string of markdown', function() {
      const parser = new MDArticle({ md });
      assert.ok(parser.mdString);
      assert.equal(typeof parser.mdString, 'string');
    });
  });
  describe('prototype.parse', function() {
    before(async function() {
      withData = await readFile('./test/stub/parser.md', 'utf-8');
    });
    it('smoketest', function() {
      const parser = new MDArticle({ md });
      assert.equal(typeof parser.parse, 'function');
    });
    it('throws sans mdString', function() {
      const parser = new MDArticle();
      assert.throws(() => {
        parser.parse();
      });
    });
    it('creates the parsed data structure', function() {
      const eSynopsis = '\nThis is the *Synopsis* text.\n';
      const parser = new MDArticle({ md });
      parser.parse();
      assert.ok(parser.data);
      assert.strictEqual(typeof parser.data, 'object');
      assert.strictEqual(parser.data.publish, 0);
      assert.strictEqual(parser.data.updated, 0);
      assert.strictEqual(parser.data.synopsis, eSynopsis);
      assert.strictEqual(parser.data.status, '');
    });
    it('sets data.status', function() {
      const withStatus = `
        <!-- Status: PUB -->
      `;
      const expectedStatus = 'PUB';
      const parser = new MDArticle({ md: withStatus });
      parser.parse();
      const { status } = parser.data;
      assert.strictEqual(status, expectedStatus);
    });
    it('sets data.synopsis', function() {
      const parser = new MDArticle({ md: withData });
      parser.parse();
      const { synopsis } = parser.data;
      assert.strictEqual(synopsis, expectedSynopsis);
    });
    it('sets data.publish', function () {
      const parser = new MDArticle({ md: withData });
      parser.parse();
      const { publish } = parser.data;
      assert.strictEqual(publish, 1571409402365);
    });
    it('sets data.updated', function () {
      const parser = new MDArticle({ md: withData });
      parser.parse();
      const { updated } = parser.data;
      assert.strictEqual(updated, 1571419390214);
    });
    it('doesnt balk at no pub or upd dates', function() {
      const noDates = `
        <!-- Published: -->
        <!-- Updated: -->
      `;
      const parser = new MDArticle({ md: noDates });
      parser.parse();
      const { updated, publish } = parser.data;
      assert.strictEqual(publish, 0);
      assert.strictEqual(updated, 0);
    });
    it('ignores garbage in the pub/upd comments', function() {
      const puGarb = `
        <!-- Published: js98w7sefkjshdf -->
        <!-- Updated: 293847sdfsdf9 -->
      `;
      const parser = new MDArticle({ md: puGarb });
      parser.parse();
      const { updated, publish } = parser.data;
      assert.strictEqual(publish, 0);
      assert.strictEqual(updated, 0);
    });
    it('handles forgotten spaces', function() {
      const input = `
        <!--Published: 1571409402365-->
        <!--Updated: 1571419390214-->
      `;
      const parser = new MDArticle({ md: input });
      parser.parse();
      const { updated, publish } = parser.data;
      assert.strictEqual(publish, 1571409402365);
      assert.strictEqual(updated, 1571419390214);
    });
    it('creates the search data structure', function () {
      const eTags = [
        'mongoose',
        'javascript',
        'node',
        'mongodb'
      ];
      const parser = new MDArticle({ md });
      parser.parse();
      assert.ok(parser.search);
      assert.strictEqual(typeof parser.search, 'object');
      assert.deepEqual(parser.search.linkTokens, eLinks);
      assert.deepEqual(parser.search.fileNameTokens, []);
      assert.deepEqual(parser.search.tags, eTags);
      const { h1Tokens, h2Tokens, h3AndUpTokens } = parser.search;
      assert.deepEqual(h1Tokens, ['arduino', 'raspberry', 'napster']);
      assert.deepEqual(h2Tokens, ['solar', 'blackhole', 'wind']);
      assert.deepEqual(h3AndUpTokens, ['glarp', 'gindle', 'mandrel', 'yankee']);
    });
    it('sets search.tags', function () {
      const parser = new MDArticle({ md: withData });
      parser.parse();
      const { tags } = parser.search;
      assert.deepEqual(tags, expectedTags);
    });
  });
  describe('prototype.isPublished', function() {
    it('smoketest', function() {
      assert.ok(yParser.isPublished);
      assert.ok(typeof yParser.isPublished === 'function');
    });
    it('returns true for a post with a past pub date', function() {
      assert.strictEqual(yParser.isPublished(), true);
    });
    it('returns false for a post with no date', function() {
      assert.strictEqual(nParser.isPublished(), false);
    });
    it('returns false for a post with a future date', function() {
      assert.strictEqual(fParser.isPublished(), false);
    });
    it('throws an error when calling a method before parse', function () {
      const parser = new MDArticle({ md: '' });
      assert.throws(() => {
        parser.isPublished();
      }, /NotParsedYetError/);
    });
  });
  describe('prototype.isUpdated', function () {
    it('smoketest', function() {
      assert.ok(yParser.isUpdated);
      assert.ok(typeof yParser.isUpdated === 'function');
    });
    it('returns true for a post with a past updated date', function () {
      assert.strictEqual(yParser.isUpdated(), true);
    });
    it('returns false for a post with no updated date', function () {
      assert.strictEqual(nParser.isUpdated(), false);
    });
    it('returns false for a post with a future updated date', function () {
      assert.strictEqual(fParser.isUpdated(), false);
    });
    it('throws an error when calling a method before parse', function () {
      const parser = new MDArticle({ md: '' });
      assert.throws(() => {
        parser.isUpdated();
      }, /NotParsedYetError/);
    });
  });
  describe('prototype.hasPublished', function() {
    it('smoketest', function() {
      assert.ok(yParser.hasPublished);
      assert.ok(typeof yParser.hasPublished === 'function');
    });
    it('returns true for a post with a past pub date', function () {
      assert.strictEqual(yParser.hasPublished(), true);
    });
    it('returns false for a post with no date', function () {
      assert.strictEqual(nParser.hasPublished(), false);
    });
    it('returns true for a post with a future date', function () {
      assert.strictEqual(fParser.hasPublished(), true);
    });
    it('throws an error when calling a method before parse', function () {
      const parser = new MDArticle({ md: '' });
      assert.throws(() => {
        parser.hasPublished();
      }, /NotParsedYetError/);
    });
  });
  describe('prototype.hasUpdated', function () {
    it('smoketest', function() {
      assert.ok(yParser.hasUpdated);
      assert.ok(typeof yParser.hasUpdated === 'function');
    });
    it('returns true for a post with a past upd date', function () {
      assert.strictEqual(yParser.hasUpdated(), true);
    });
    it('returns false for a post with no date', function () {
      assert.strictEqual(nParser.hasUpdated(), false);
    });
    it('returns true for a post with a future upd date', function () {
      assert.strictEqual(fParser.hasUpdated(), true);
    });
    it('throws an error when calling a method before parse', function () {
      const parser = new MDArticle({ md: '' });
      assert.throws(() => {
        parser.hasUpdated();
      }, /NotParsedYetError/);
    });
  });
  describe('prototype.futurePublish', function() {
    it('smoketest', function() {
      assert.ok(yParser.futurePublish);
      assert.ok(typeof yParser.futurePublish === 'function');
    });
    it('returns false for a post with a past pub date', function () {
      assert.strictEqual(yParser.futurePublish(), false);
    });
    it('returns false for a post with no date', function () {
      assert.strictEqual(nParser.futurePublish(), false);
    });
    it('returns true for a post with a future date', function () {
      assert.strictEqual(fParser.futurePublish(), true);
    });
    it('throws an error when calling a method before parse', function () {
      const parser = new MDArticle({ md: '' });
      assert.throws(() => {
        parser.futurePublish();
      }, /NotParsedYetError/);
    });
  });
});
