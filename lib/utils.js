'use strict';

const { readFile } = require('fs').promises;
const marked = require('marked');

function searchGen(path) {
  return new Promise((res, rej) => {
    readFile(path, 'utf-8')
      .then(file => {
        res({
          path: path.replace(/md$/, 'html'),
          level: [
            {
              name: 'fileName/Tags',
              tokens: getTokensFromFile(path).concat(getTagsFromFile(file))
            },
            { name: 'header1', tokens: getH1sFromFile(file) },
            { name: 'header2', tokens: getH2sFromFile(file) },
            { name: 'header3-6', tokens: getH3AndUpFromFile(file) },
            { name: 'links', tokens: getLinksFromFile(file) }
          ]
        });
      })
      .catch(err => {
        rej(err);
      });
  });
}

function getLinksFromFile(input) {
  let style1 = new RegExp(/\[([^\]]+)\]\(([^)]+)\)/, 'gs');
  let style2 = new RegExp(/\[([^\]]+)\]\[(\d+)\]/, 'gs');
  let style3 = new RegExp(/\[([^\]\d]+)\][^:()[\] ]/, 'gs');
  let links = [];
  let a;

  while ((a = style1.exec(input)) != null) {
    let x = a[1].split(' ');
    for (let e of x) {
      links.push(e.trim());
    }
    links.push(a[2].replace('https://', '').replace('.com', '').trim());
  }

  while ((a = style2.exec(input)) != null) {
    let tokens = a[1].split(' ');
    for (let t of tokens) {
      links.push(t.trim());
    }

    let str = '\\[' + `${a[2]}` + '\\]:[\\s]*(.*)';
    let lre = new RegExp(str, 'g');
    let linkDest = lre
      .exec(input)[1]
      .replace('https://', '')
      .replace('.com', '')
      .trim();
    links.push(linkDest);
  }

  while((a = style3.exec(input)) != null) {
    let tokens = a[1].split(' ');
    for (let t of tokens) {
      links.push(t.trim());
    }
    let str = '\\[' + `${a[1]}` + '\\]:[\\s]*(.*)';
    let lre = new RegExp(str, 'g');
    let linkDest = lre
      .exec(input)[1]
      .replace('https://', '')
      .replace('.com', '')
      .trim();
    links.push(linkDest);
  }

  return links.filter((l,i,a) => {
    return !a.includes(l, i + 1);
  });
}

function getTokensFromFile(str) {
  return str
    .replace(/^.*\/([^/]+)\.md$/, '$1')
    .split('_');
}

function getSynopsisFromText(input) {
  let ret = '';
  let c = input.split('');
  let { length } = c;
  let inComment = false;
  let inSynopsis = false;
  let i = 0;

  while (i < length) {
    let nextFour = getNCharsFrom(4, input, i);
    let nextThree = nextFour.replace(/[\W\s\w]$/, '');
    let next14 = getNCharsFrom(14, input, i);
    let next12 = next14.replace(/[\W\s\w]{2}$/, '');

    if (nextFour === '<!--') {
      inComment = true;
      i = i + 4;
      continue;
    }
    if (inComment && nextThree === '-->') {
      inComment = false;
      i = i + 3;
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
      ret += c[i++];
    } else {
      i++;
    }
  }

  return marked(ret.trim());
}

function getNCharsFrom(n=1, fr, i=0) {
  let ret = '';
  while (i < fr.length && n > 0) {
    ret += fr[i++];
    n--;
  }
  return ret;
}

function getTagsFromFile(input) {
  let c = input.split('');
  let { length } = c;
  let inComment = false;
  let collectingTags = false;
  let tags = [];
  let i = 0;
  while (i < length) {
    if (`${c[i]}${c[i + 1]}${c[i + 2]}${c[i + 3]}` === '<!--') {
      inComment = true;
      i = i + 4;
      continue;
    }
    let s = `${c[i]}${c[i + 1]}${c[i + 2]}${c[i + 3]}${c[i + 4]}`;
    if (inComment && /tags:/i.test(s)) {
      collectingTags = true;
      i = i + 5;
      continue;
    }

    if (inComment && collectingTags) {
      let end = false;
      let s = '';
      let j = i;
      while (!end) {
        let char = c[j];
        if (/-->/.test(`${c[j]}${c[j+1]}${c[j+2]}`)) {
          end = true;
          inComment = false;
          collectingTags = false;
          tags.push(s);
          continue;
        }
        if (char === ',') {
          tags.push(s);
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
    if (inComment && /-->/.test(`${c[i]}${c[i + 1]}${c[i + 2]}`)) {
      inComment = false;
      i = i + 3;
      continue;
    }
    i++;
  }
  return tags.map(tag => tag.trim());
}

function getH1sFromFile(input) {
  return getHeaderTokensFromFile(input, '^[ ]*#[^#]*$');
}

function getH2sFromFile(input) {
  return getHeaderTokensFromFile(input, '^[ ]*##[^#]+$');
}

function getH3AndUpFromFile(input) {
  return getHeaderTokensFromFile(input, '^[ ]*###.*$');
}

function getHeaderTokensFromFile(input, pattern) {
  let regExp = new RegExp(pattern);
  return input
    .split('\n')
    .filter(line => regExp.test(line))
    .map(line => {
      return line
        .replace(/^[\s]*[#]+/, '')
        .toLowerCase()
        .split(' ');
    })
    .flat(Infinity)
    .filter(Boolean);
}

module.exports = {
  searchGen,
  getSynopsisFromText,
  getNCharsFrom
};
