'use strict';

const assert = require('assert');
const { MDArticle } = require('../lib/mdarticle');

const {
  readFileSync,
  openSync,
  writeFileSync,
  unlinkSync,
  promises } = require('fs');

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
    it('instance isnt a function', function() {
      const article = new MDArticle();
      assert.strictEqual(typeof article, 'object');
    });
  });
  describe('options', function() {
    before(async function() {
      md = await readFile('./test/stub/test_icicle.md', 'utf-8');
    });
    it('takes a file object', function() {
      const parser = new MDArticle({ open: fh });
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
      assert.strictEqual(parser.data.published, 0);
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
    it('sets data.published', function () {
      const parser = new MDArticle({ md: withData });
      parser.parse();
      const { published } = parser.data;
      assert.strictEqual(published, 1571409402365);
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
      const { updated, published } = parser.data;
      assert.strictEqual(published, 0);
      assert.strictEqual(updated, 0);
    });
    it('ignores garbage in the pub/upd comments', function() {
      const puGarb = `
        <!-- Published: js98w7sefkjshdf -->
        <!-- Updated: 293847sdfsdf9 -->
      `;
      const parser = new MDArticle({ md: puGarb });
      parser.parse();
      const { updated, published } = parser.data;
      assert.strictEqual(published, 0);
      assert.strictEqual(updated, 0);
    });
    it('handles forgotten spaces', function() {
      const input = `
        <!--Published: 1571409402365-->
        <!--Updated: 1571419390214-->
      `;
      const parser = new MDArticle({ md: input });
      parser.parse();
      const { updated, published } = parser.data;
      assert.strictEqual(published, 1571409402365);
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
  describe('prototype.publishArticle', function() {
    it('smoketest', function () {
      const article = new MDArticle({ md: '' });
      assert.ok(article.publishArticle);
      assert.ok(typeof article.publishArticle === 'function');
    });
    it('returns false for a WIP', function() {
      const article = new MDArticle({ md: '<!-- Status: WIP -->'});
      article.parse();
      assert.strictEqual(article.publishArticle(), false);
    });
    it('returns true for PUB with no dates', function () {
      const article = new MDArticle({
        md: `
          <!-- Status: PUB -->
          <!-- Published: -->
          <!-- Updated: -->
        `
      });
      article.parse();
      assert.strictEqual(article.publishArticle(), true);
    });
    it('returns false for UPD', function () {
      const article = new MDArticle({ md: '<!-- Status: UPD -->' });
      article.parse();
      assert.strictEqual(article.publishArticle(), false);
    });
  });
  describe('prototype.updateArticle', function() {
    it('smoketest', function () {
      const article = new MDArticle({ md: '' });
      assert.ok(article.updateArticle);
      assert.ok(typeof article.updateArticle === 'function');
    });
    it('throws if called before parse', function() {
      const article = new MDArticle({ md: '# test'});
      assert.throws(() => {
        article.updateArticle();
      }, /NotParsedYetError/);
    });
    it('returns false for WIP', function() {
      const article = new MDArticle({ md: '<!-- Status: WIP -->'});
      article.parse();
      assert.strictEqual(article.updateArticle(), false);
    });
    it('returns false for PUB', function() {
      const article = new MDArticle({ md: '<!-- Status: PUB -->' });
      article.parse();
      assert.strictEqual(article.updateArticle(), false);
    });
    it('returns true for UPD', function() {
      const article = new MDArticle({ md: '<!-- Status: UPD -->' });
      article.parse();
      assert.strictEqual(article.updateArticle(), true);
    });
  });
  describe('prototype.markPublished', function() {
    before(function () {
      writeFileSync('./test/stub/temp_mp.md', '<!-- Published: -->');
    });
    after(function () {
      unlinkSync('./test/stub/temp_mp.md');
    });
    it('smoketest', function () {
      const article = new MDArticle({ md: '' });
      assert.ok(article.markPublished);
      assert.ok(typeof article.markPublished === 'function');
    });
    it('should throw an error if called before parse', function() {
      const article = MDArticle({ md: '' });
      assert.throws(() => {
        article.markPublished();
      }, /NotParsedYetError/);
    });
    it('should throw an error if called on article sans path', function() {
      const article = new MDArticle({ md: '# Test' });
      article.parse();
      assert.throws(() => {
        article.markPublished();
      }, /MethodRequiresPathError/);
    });
    it('should update a timestamp and reparse', function() {
      const article = new MDArticle({ path: './test/stub/temp_mp.md' });
      article.parse();
      article.markPublished();
      assert.ok(/<!-- Published: [\d]+ -->/.test(article.mdString));
      assert.ok(article.data.published !== 0);
    });
    it('throws if article is already published', function() {
      const article = new MDArticle({ path: './test/stub/temp_mp.md' });
      article.parse();
      assert.throws(() => {
        article.markPublished();
      }, /AlreadyPublishedError/);
    });
  });
  describe('prototype.markUpdated', function() {
    const p = './test/stub/for_updating.md';
    let originalFileContents;
    before(async function() {
      originalFileContents = await readFile(p, 'utf-8');
    });
    after(function() {
      writeFileSync(p, originalFileContents);
    });
    it('smoketest', function () {
      const article = new MDArticle({ md: '' });
      assert.ok(article.markUpdated);
      assert.ok(typeof article.markUpdated === 'function');
    });
    it('should throw on an article that hasnt been parsed', function() {
      const article = new MDArticle({ md: '' });
      assert.throws(() => {
        article.markUpdated();
      }, /NotParsedYetError/);
    });
    it('should throw on any status other than UPD', function() {
      const article1 = new MDArticle({ md: '<!-- Status: -->' });
      const article2 = new MDArticle({ md: '<!-- Status: WIP -->' });
      const article3 = new MDArticle({ md: '<!-- Status: PUB -->' });
      article1.parse();
      article2.parse();
      article3.parse();
      assert.throws(() => {
        article1.markUpdated();
      }, /ArticleNotUpdatable/);
      assert.throws(() => {
        article2.markUpdated();
      }, /ArticleNotUpdatable/);
      assert.throws(() => {
        article3.markUpdated();
      }, /ArticleNotUpdatable/);
    });
    it('should update the timestamp in Updated comment', function () {
      const article = new MDArticle({ path: p });
      article.parse();
      console.log(`article.data.status: ${article.data.status}`);
      article.markUpdated();
      assert.strictEqual(/Updated: [\d]+/.test(article.mdString), true);
    });
    it('should have updated the file contents', async function() {
      const contents = await readFile(p, 'utf-8');
      assert.strictEqual(/Updated: [\d]+/.test(contents), true);
    });
    it('should return the status to PUB', async function () {
      const contents = await readFile(p, 'utf-8');
      assert.strictEqual(/Status: PUB/.test(contents), true);
    });
  });
  describe('prototype.writeBack', function() {
    before(function() {
      writeFileSync('./test/stub/temp_wb.md', '# WRITEBACK');
    });
    after(function() {
      unlinkSync('./test/stub/temp_wb.md');
    });
    it('smoketest', function () {
      const article = new MDArticle({ md: '' });
      assert.ok(article.writeBack);
      assert.ok(typeof article.writeBack === 'function');
    });
    it('should throw an error if called before parse', function () {
      const article = MDArticle({ md: '' });
      assert.throws(() => {
        article.writeBack();
      }, /NotParsedYetError/);
    });
    it('should throw an error if called on article sans path', function () {
      const article = new MDArticle({ md: '# Test' });
      article.parse();
      assert.throws(() => {
        article.writeBack();
      }, /MethodRequiresPathError/);
    });
    it('writes changes back to path', function() {
      const article = new MDArticle({ path: './test/stub/temp_wb.md' });
      article.parse();
      article.mdString += '\n# TEST123';
      article.writeBack();
      const actual = readFileSync('./test/stub/temp_wb.md', 'utf-8');
      const expected = '# WRITEBACK\n# TEST123';
      assert.strictEqual(actual, expected);
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
  describe('prototype.publishedOn', function() {
    it('smoketest', function () {
      assert.ok(yParser.publishedOn);
      assert.ok(typeof yParser.publishedOn === 'function');
    });
    it('returns a date string of the published date', function() {
      const md = `
        <!-- Published: 1571664076613 -->
      `;
      const article = new MDArticle({ md });
      article.parse();
      let actual = article.publishedOn();
      let expected = 'Mon Oct 21 2019';
      assert.strictEqual(actual, expected);
    });
    it('returns an empty string without a published date', function() {
      const md = '# Test';
      const article = new MDArticle({ md });
      article.parse();
      let actual = article.publishedOn();
      let expected = '';
      assert.strictEqual(actual, expected);
    });
  });
  describe('prototype.updatedOn', function() {
    it('smoketest', function () {
      assert.ok(yParser.updatedOn);
      assert.ok(typeof yParser.updatedOn === 'function');
    });
    it('returns a date string of the updated date', function () {
      const md = `
      <!-- Updated: 1571664076613 -->
      `;
      const article = new MDArticle({ md });
      article.parse();
      let actual = article.updatedOn();
      let expected = 'Mon Oct 21 2019';
      assert.strictEqual(actual, expected);
    });
    it('returns an empty string without an updated date', function () {
      const md = '# Test';
      const article = new MDArticle({ md });
      article.parse();
      let actual = article.updatedOn();
      let expected = '';
      assert.strictEqual(actual, expected);
    });
  });
  describe('file structure', function() {
    let article;
    before(function() {
      article = new MDArticle({ path: './test/stub/test_icicle_mul.md' });
    });
    it('creates file data structure with path', function() {
      assert.ok(article.file);
      assert.ok(typeof article.file === 'object');
    });
    it('sets default file.in', function() {
      assert.ok(article.file.in);
      assert.strictEqual(typeof article.file.in, 'string');
      assert.strictEqual(article.file.in, './posts/');
    });
    it('sets default file.out', function () {
      assert.ok(article.file.out);
      assert.strictEqual(typeof article.file.out, 'string');
      assert.strictEqual(article.file.out, './docs/posts/');
    });
    it('sets file.link', function() {
      assert.ok(article.file.link);
      assert.strictEqual(typeof article.file.link, 'string');
      assert.strictEqual(article.file.link, './posts/test_icicle_mul.html');
    });
    it('sets file.title', function() {
      assert.ok(article.file.title);
      assert.strictEqual(typeof article.file.title, 'string');
      assert.strictEqual(article.file.title, 'test icicle mul');
    });
    it('accepts custom file options', function() {
      let article = new MDArticle({
        path: './test/stub/yet_another.md',
        file: {
          in: './test/stub/',
          out: './test/stub/docs/'
        }
      });
      assert.ok(article.file.in);
      assert.ok(article.file.out);
      assert.strictEqual(article.file.in, './test/stub/');
      assert.strictEqual(article.file.out, './test/stub/docs/');
    });
  });
});
