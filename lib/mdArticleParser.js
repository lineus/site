'use strict';

const { readFileSync } = require('fs');
const {
  getNCharsFrom,
  getLinkTokensFromText,
  getTokensFromFilename,
  getH1sFromFile,
  getH2sFromFile,
  getH3AndUpFromFile
} = require('./utils');

function MDArticleParser(options) {
  options = options || {};
  if (!(this instanceof MDArticleParser)) {
    return new MDArticleParser(options);
  }

  if (options.md && typeof options.md === 'string'){
    this.mdString = options.md;
  } else if (options.file || options.path) {
    const target = options.file || options.path;
    switch(typeof target) {
      case 'number':
      case 'string':
        this.mdString = readFileSync(target, 'utf-8');
        break;
      default:
        throw new Error('FileNotAFileError');
    }
  }
  this.path = options.path || '';
  return this;
}

MDArticleParser.prototype.checkParsed = function() {
  if (!this.parsed) {
    throw new Error('NotParsedYetError');
  }
};

MDArticleParser.prototype.isPublished = function() {
  this.checkParsed();
  let ret = false;
  let now = Date.now();
  if (this.data.publish && (typeof this.data.publish === 'number')) {
    if (now > this.data.publish) {
      ret = true;
    }
  }
  return ret;
};

MDArticleParser.prototype.isUpdated = function() {
  this.checkParsed();
  let ret = false;
  let now = Date.now();
  if (this.data.updated && (typeof this.data.updated === 'number')) {
    if (now > this.data.updated) {
      ret = true;
    }
  }
  return ret;
};

MDArticleParser.prototype.hasPublished = function() {
  this.checkParsed();
  return /<!--\s*published:[\d\s]*-->/i.test(this.mdString);
};

MDArticleParser.prototype.hasUpdated = function() {
  this.checkParsed();
  return /<!--\s*updated:[\d\s]*-->/i.test(this.mdString);
};

MDArticleParser.prototype.futurePublish = function() {
  this.checkParsed();
  let ret = false;
  let now = Date.now();
  if (this.data.publish && (typeof this.data.publish === 'number')) {
    if (now <= this.data.publish) {
      ret = true;
    }
  }
  return ret;
};

MDArticleParser.prototype.genSearch = function() {
  return {
    path: this.path.replace(/md$/, 'html'),
    level: [
      {
        name: 'fileName/Tags',
        tokens: this.search.fileNameTokens
          .concat(this.search.tags)
      },
      { name: 'header1', tokens: this.search.h1Tokens },
      { name: 'header2', tokens: this.search.h2Tokens },
      { name: 'header3-6', tokens: this.search.h3AndUpTokens },
      { name: 'links', tokens: this.search.linkTokens }
    ]
  };
};

MDArticleParser.prototype.parse = function() {
  if (!this.mdString) {
    throw new Error('NoMDStringError');
  }

  this.data = Object.create(null);
  this.data.publish = 0;
  this.data.updated = 0;
  this.data.synopsis = '';
  this.data.status = '';

  this.search = Object.create(null);
  this.search.linkTokens = getLinkTokensFromText(this.mdString);
  this.search.fileNameTokens = getTokensFromFilename(this.path).filter(Boolean);
  this.search.tags = [];
  this.search.h1Tokens = getH1sFromFile(this.mdString);
  this.search.h2Tokens = getH2sFromFile(this.mdString);
  this.search.h3AndUpTokens = getH3AndUpFromFile(this.mdString);

  let inComment = false;
  let inSynopsis = false;
  let inStatus = false;
  let collectingTags = false;
  let inPublish = false;
  let inUpdated = false;
  let temp = '';
  let garbage = false;

  let c = this.mdString.split('');
  let { length } = c;
  let i = 0;

  while (i < length) {
    let nextFive = getNCharsFrom(5, this.mdString, i);
    let nextFour = nextFive.replace(/[\W\s\w]$/, '');
    let nextThree = nextFour.replace(/[\W\s\w]$/, '');
    let next14 = getNCharsFrom(14, this.mdString, i);
    let next12 = next14.replace(/[\W\s\w]{2}$/, '');
    let nextTen = next12.replace(/[\W\s\w]{2}$/, '');
    let nextEight = nextTen.replace(/[\W\s\w]{2}$/, '');
    let nextSeven = nextEight.replace(/[\W\s\w]$/, '');

    if (nextFour === '<!--') {
      inComment = true;
      i = i + 4;
      continue;
    }

    if (inComment && !inSynopsis && next14 === 'Synopsis Start') {
      inSynopsis = true;
      i = i + 14;
      continue;
    }

    if (inComment && inSynopsis && next12 === 'Synopsis End') {
      inSynopsis = false;
      i = i + 12;
      continue;
    }

    if (!inComment && inSynopsis) {
      this.data.synopsis += c[i++];
      continue;
    }

    if (inComment && /tags:/i.test(nextFive)) {
      collectingTags = true;
      i = i + 5;
      continue;
    }

    if (inComment && /Status:/i.test(nextSeven)) {
      inStatus = true;
      i = i + 7;
      continue;
    }

    if (inComment && inStatus) {
      let j = i;
      let n3 = '';
      while (!(/-->/.test(n3))) {
        n3 = getNCharsFrom(3, this.mdString, j);
        if (/[a-zA-Z]/.test(c[j])) {
          this.data.status += c[j];
        }
        j++;
      }
      i = j;
      inStatus = false;
    }

    if (inComment && collectingTags) {
      let end = false;
      let s = '';
      let j = i;
      while (!end) {
        let char = c[j];
        let n3 = getNCharsFrom(3, this.mdString, j);
        if (/-->/.test(n3)) {
          end = true;
          inComment = false;
          collectingTags = false;
          this.search.tags.push(s.trim());
          continue;
        }
        if (char === ',') {
          this.search.tags.push(s.trim());
          s = '';
          j++;
          continue;
        } else {
          s += char;
          j++;
          continue;
        }
      }
    }

    if ( inComment && /Published:/.test(nextTen)) {
      inPublish = true;
      i += 10;
      continue;
    }

    if (inComment && /Updated:/.test(nextEight)) {
      inUpdated = true;
      i += 8;
      continue;
    }

    if (inComment && (inPublish||inUpdated)) {
      let which = inPublish ? 'publish':'updated';
      let n3 = getNCharsFrom(3, this.mdString, i);
      if (!(/-->/.test(n3))) {
        if (/[\d]/.test(`${c[i]}`)) {
          temp += `${c[i]}`;
        } else if (/[^\s\d]/.test(`${c[i]}`)) {
          garbage = true;
        }
      } else {
        if (!garbage && temp !== '') {
          this.data[which] = Number(temp);
        }
        temp = '';
        inUpdated = false;
        inPublish = false;
        garbage = false;
      }
    }

    if (inComment && nextThree === '-->') {
      inComment = false;
      inPublish = false;
      inUpdated = false;
      collectingTags = false;
      i = i + 3;
      continue;
    }

    i++;
  }

  this.parsed = true;
};

module.exports = {
  MDArticleParser
};
