'use strict';

module.exports = {
  getNCharsFrom,
  getTokensFromFilename,
  getLinkTokensFromText,
  getH1sFromFile,
  getH2sFromFile,
  getH3AndUpFromFile
};

function getLinkTokensFromText(input) {
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
      .replace('http://', '')
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

function getTokensFromFilename(str) {
  return str
    .replace(/^.*\/([^/]+)\.md$/, '$1')
    .split('_');
}

function getNCharsFrom(n=1, fr, i=0) {
  let ret = '';
  while (i < fr.length && n > 0) {
    ret += fr[i++];
    n--;
  }
  return ret;
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
