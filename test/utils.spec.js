'use strict';

const assert = require('assert');
const { searchGen } = require('../lib/utils');
const { isPromise } = require('util').types;

describe('utils', function() {
  describe('search generator', function() {
    it('smoketest', function() {
      assert.strictEqual(typeof searchGen, 'function');
    });

    let res = searchGen('test/stub/test_icicle.md');
    let obj;
    it('returns a promise', function() {
      assert.ok(isPromise(res));
    });

    it('promise resolves to an object', async function() {
      await res.then(o => {
        assert.strictEqual(typeof o, 'object');
        obj = o;
      });
    });

    it('bails on a bad input path', function() {
      assert.rejects(searchGen('thispathdoesntexist.md'));
    });

    it('return object has correct level 0 (fileName) value', function() {
      assert.ok(obj.level[0] && typeof obj.level[0] === 'object');
      let { tokens, name, tags } = obj.level[0];
      assert.deepStrictEqual(tokens, ['test', 'icicle']);
      assert.strictEqual(name, 'fileName/Tags');
      let eTags = ['mongoose', 'javascript', 'node', 'mongodb'];
      assert.deepStrictEqual(tags, eTags);
    });

    it('return object has correct level 1 (header1) value', function() {
      assert.ok(obj.level[1] && typeof obj.level[1] === 'object');
      let { tokens, name } = obj.level[1];
      assert.deepStrictEqual(tokens, ['arduino', 'raspberry', 'napster']);
      assert.strictEqual(name, 'header1');
    });

    it('return object has correct level 2 (header2) value', function() {
      assert.ok(obj.level[2] && typeof obj.level[2] === 'object');
      let { tokens, name } = obj.level[2];
      assert.deepStrictEqual(tokens, ['solar', 'blackhole', 'wind']);
      assert.strictEqual(name, 'header2');
    });

    it('return object has correct level 3 (header3-6) value', function () {
      assert.ok(obj.level[3] && typeof obj.level[3] === 'object');
      let { tokens, name } = obj.level[3];
      assert.deepStrictEqual(tokens, ['glarp', 'gindle', 'mandrel', 'yankee']);
      assert.strictEqual(name, 'header3-6');
    });

    it('return object has correct level 4 (links) value', function() {
      assert.ok(obj.level[4] && typeof obj.level[4] === 'object');
      let { tokens, name } = obj.level[4];
      let eTokens = [
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
      assert.deepStrictEqual(tokens, eTokens);
      assert.strictEqual(name, 'links');
    });

    // xit('', function(){ });
    // xit('', function(){ });
  });
});
