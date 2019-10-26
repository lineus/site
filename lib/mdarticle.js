'use strict';

const { readFileSync, writeFileSync } = require('fs');
const {
  getNCharsFrom,
  getLinkTokensFromText,
  getTokensFromFilename,
  getH1sFromFile,
  getH2sFromFile,
  getH3AndUpFromFile
} = require('./utils');

function MDArticle(options) {
  options = options || {};
  if (!(this instanceof MDArticle)) {
    return new MDArticle(options);
  }

  if (options.md && typeof options.md === 'string'){
    this.mdString = options.md;
  } else if (options.open || options.path) {
    const target = options.open || options.path;
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
  if (this.path && this.path.length > 0) {
    this.file = Object.create(null);
    this.file.name = this.path.replace(/.*\/([^/]+)$/, '$1');
    this.file.title = this.file.name.replace('.md', '').replace(/_/g, ' ');
  }

  if (this.file && options.file && options.file.in) {
    this.file.in = options.file.in;
  } else if (this.file) {
    this.file.in = './posts/';
    this.file.link = `${this.file.in}${this.file.name.replace(/md$/, 'html')}`;
    this.file.fullPathIn = `${this.file.in}${this.file.name}`;
  }

  if (this.file && options.file && options.file.out) {
    this.file.out = options.file.out;
  } else if (this.file) {
    this.file.out = './docs/posts/';
    this.file
      .fullPathOut = `${this.file.out}${this.file.name.replace(/md$/, 'html')}`;
  }




  return this;
}

MDArticle.prototype.publishArticle = function() {
  this.checkParsed();
  let { status, published, updated } = this.data;
  if (status === 'WIP' || status === 'UPD') {
    return false;
  } else if (status === 'PUB' && published === 0 && updated === 0) {
    return true;
  }

  return false;
};

MDArticle.prototype.updateArticle = function () {
  this.checkParsed();
  let { status } = this.data;
  if (status === 'UPD') {
    return true;
  }
  return false;
};

MDArticle.prototype.publishedOn = function () {
  if (this.data && this.data.published) {
    return new Date(this.data.published).toDateString();
  }
  return '';
};

MDArticle.prototype.updatedOn = function() {
  if (this.data && this.data.updated) {
    return new Date(this.data.updated).toDateString();
  }
  return '';
};

MDArticle.prototype.markPublished = function (stamp) {
  stamp = stamp || Date.now();
  this.checkParsed();
  this.checkPath();
  if (/<!-- Published:[\s]*[\d]+[\s]*-->/.test(this.mdString)) {
    throw new Error('AlreadyPublishedError');
  }
  let d = `<!-- Published: ${stamp} -->`;
  this.mdString = this.mdString.replace(/<!-- Published:[\s]*-->/, d);
  this.parse();
  this.writeBack();
};

MDArticle.prototype.markUpdated = function() {
  this.checkParsed();
  if (this.data.status !== 'UPD' || this.data.published < 1) {
    throw new Error('ArticleNotUpdatable');
  }
  const update = `<!-- Updated: ${Date.now()} -->`;
  const re = new RegExp('<!--[\\s]*Updated:[\\s\\d]*-->');
  this.mdString = this.mdString.replace(re, update);
  const status = '<!-- Status: PUB -->';
  const re2 = new RegExp('<!--[\\s]+Status:[\\s]+UPD[\\s]+-->');
  this.mdString = this.mdString.replace(re2, status);
  this.parse();
  this.writeBack();
};

MDArticle.prototype.writeBack = function () {
  this.checkParsed();
  this.checkPath();
  writeFileSync(this.path, this.mdString);
};

MDArticle.prototype.checkPath = function() {
  if (!this.path || typeof this.path !== 'string' || this.path.length < 1) {
    throw new Error('MethodRequiresPathError');
  }
};

MDArticle.prototype.checkParsed = function() {
  if (!this.parsed) {
    throw new Error('NotParsedYetError');
  }
};

MDArticle.prototype.isPublished = function() {
  this.checkParsed();
  let ret = false;
  let now = Date.now();
  if (this.data.published && (typeof this.data.published === 'number')) {
    if (now > this.data.published) {
      ret = true;
    }
  }
  return ret;
};

MDArticle.prototype.isUpdated = function() {
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

MDArticle.prototype.hasPublished = function() {
  this.checkParsed();
  return /<!--\s*published:[\d\s]*-->/i.test(this.mdString);
};

MDArticle.prototype.hasUpdated = function() {
  this.checkParsed();
  return /<!--\s*updated:[\d\s]*-->/i.test(this.mdString);
};

MDArticle.prototype.futurePublish = function() {
  this.checkParsed();
  let ret = false;
  let now = Date.now();
  if (this.data.published && (typeof this.data.published === 'number')) {
    if (now <= this.data.published) {
      ret = true;
    }
  }
  return ret;
};

MDArticle.prototype.genSearch = function() {
  this.checkParsed();
  return {
    path: this.path.replace(/md$/, 'html'),
    level: [
      { name: 'fileName', tokens: this.search.fileNameTokens },
      { name: 'tags', tokens: this.search.tags },
      { name: 'header1', tokens: this.search.h1Tokens },
      { name: 'header2', tokens: this.search.h2Tokens },
      { name: 'header3-6', tokens: this.search.h3AndUpTokens },
      { name: 'links', tokens: this.search.linkTokens }
    ]
  };
};

MDArticle.prototype.parse = function() {
  if (!this.mdString) {
    throw new Error('NoMDStringError');
  }

  this.data = Object.create(null);
  this.data.published = 0;
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
      let which = inPublish ? 'published':'updated';
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
  MDArticle
};
