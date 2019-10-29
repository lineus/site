'use strict';

const assert = require('assert');
const { searchFactory } = require('../includes/js/search.js');
const { readFileSync } = require('fs');

const searchJSON = JSON.parse(readFileSync('./test/stub/search.json', 'utf-8'));

describe('searchFactory', function() {
  it('smoketest', function() {
    assert.ok(searchFactory);
    assert.strictEqual(typeof searchFactory, 'function');
  });
  it('throws an error sans search object', function() {
    assert.throws(() => {
      searchFactory();
    }, /SearchFactoryRequiresDataError/);
  });
  it('returns a function', function() {
    const search = searchFactory(searchJSON);
    assert.strictEqual(typeof search, 'function');
  });
  describe('search', function() {
    const search = searchFactory(searchJSON);
    const noQResults = search();
    const emptyStringResults = search('');
    it('returns array of all paths sans query', function() {
      assert.strictEqual(Array.isArray(noQResults), true);
      const expected = [
        './posts/Third_Times_The_Charm.html',
        './posts/This_is_Test_2.html',
        './posts/fourth_awesome_post.html',
        './posts/test.html'
      ];
      assert.deepEqual(noQResults, expected);
    });
    it('returns array of all paths with empty string query', function () {
      assert.strictEqual(Array.isArray(emptyStringResults), true);
      const expected = [
        './posts/Third_Times_The_Charm.html',
        './posts/This_is_Test_2.html',
        './posts/fourth_awesome_post.html',
        './posts/test.html'
      ];
      assert.deepEqual(emptyStringResults, expected);
    });
    it('searches all levels sans Level Specifier', function() {
      const search = searchFactory(searchJSON);
      let res = search('Charm');
      assert.strictEqual(Array.isArray(res), true);
      assert.strictEqual(res.length, 2);
      assert.strictEqual(res[0].level, 0);
      assert.strictEqual(res[0].path, './posts/Third_Times_The_Charm.html');
      assert.strictEqual(res[1].level, 1);
      assert.strictEqual(res[1].path, './posts/This_is_Test_2.html');
    });
    describe('Level Specifiers', function() {
      it('filename: only searches file names', function() {
        const search = searchFactory(searchJSON);
        let res = search('filename:Charm');
        assert.strictEqual(Array.isArray(res), true);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].level, 0);
        assert.strictEqual(res[0].path, './posts/Third_Times_The_Charm.html');
      });
      it('tags: only searches tags', function () {
        const search = searchFactory(searchJSON);
        let res = search('tags:Ted');
        assert.strictEqual(Array.isArray(res), true);
        assert.strictEqual(res.length, 4);
        assert.strictEqual(res[0].level, 1);
        assert.strictEqual(res[0].path, './posts/Third_Times_The_Charm.html');
        assert.strictEqual(res[1].level, 1);
        assert.strictEqual(res[1].path, './posts/This_is_Test_2.html');
        assert.strictEqual(res[2].level, 1);
        assert.strictEqual(res[2].path, './posts/fourth_awesome_post.html');
        assert.strictEqual(res[3].level, 1);
        assert.strictEqual(res[3].path, './posts/test.html');
      });
      it('headers: only searches headers', function () {
        const search = searchFactory(searchJSON);
        let res = search('headers:this headers:will');
        assert.strictEqual(Array.isArray(res), true);
        assert.strictEqual(res.length, 3);
        assert.strictEqual(res[0].level, 2);
        assert.strictEqual(res[0].path, './posts/fourth_awesome_post.html');
        assert.strictEqual(res[1].level, 3);
        assert.strictEqual(res[1].path, './posts/fourth_awesome_post.html');
        assert.strictEqual(res[2].level, 3);
        assert.strictEqual(res[2].path, './posts/test.html');
      });
      it('links: only searches links', function() {
        const search = searchFactory(searchJSON);
        let res = search('links:staples');
        assert.strictEqual(Array.isArray(res), true);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].level, 5);
        assert.strictEqual(res[0].path, './posts/Third_Times_The_Charm.html');
      });
    });
    describe('just a bunch of queries', function() {
      xit('', function() {
        const search = searchFactory(searchJSON);
        let res = search('');
      });
    });
  });
});
