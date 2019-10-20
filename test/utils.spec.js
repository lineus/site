'use strict';

const assert = require('assert');
const { getNCharsFrom } = require('../lib/utils');

describe('utils', function() {
  describe('getNCharsFrom', function() {
    it('first six characters', function() {
      let expected = 'blargh';
      let actual = getNCharsFrom(6, 'blarghfooeyshlaper');
      assert.strictEqual(actual, expected);
    });
    it('middle six characters', function() {
      let expected = 'blargh';
      let actual = getNCharsFrom(6, 'fooeyblarghshlaper', 5);
      assert.strictEqual(actual, expected);
    });
  });
});
