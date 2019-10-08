'use strict';

const { readFile } = require('fs').promises;

function searchGen(path) {
  return new Promise((res, rej) => {
    readFile(path, 'utf-8')
      .then(file => {
        res({
          level: [
            {
              name: 'fileName/Tags',
              tokens: getTokensFromFile(path),
              tags: getTagsFromFile(file)
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
  searchGen
};
