'use strict';

module.exports = {
  searchFactory
};

function searchFactory(searchData) {
  if (!searchData) {
    throw new Error('SearchFactoryRequiresDataError');
  }

  return new go();

  function go() {
    this.data = searchData;
    this.result = [];
    const search = (query) => {
      if (!query) {
        return this.data.map(f => f.path);
      }
      const hasLevelSpecifier = /[\w]+:[\w]+/.test(query);
      const queryTokens = query.split(' ');
      const forThese = [];
      if (hasLevelSpecifier) {
        const validLS = ['filename', 'tags', 'headers', 'links'];
        queryTokens.map(q => {
          if (/[\w]+:[\w]+/.test(q)) {
            const [token, qString] = q.split(':');
            if (!validLS.includes(token)) {
              throw new Error(`InvalidQueryTokenError: ${token}`);
            }
            forThese.push({ token, qString });
          } else {
            forThese.push({ token: 'all', qString: q });
          }
        });
      } else {
        queryTokens.map(q => {
          forThese.push({ token: 'all', qString: q });
        });
      }

      const allSearch = (q) => {
        this.data.map(f => {
          for (let i = 0; i < 6; i++) {
            if (f.level[i].tokens.includes(q)) {
              this.result.push({ level: i, path: f.path });
            }
          }
        });
      };
      const fSearch = (q) => {
        this.data.map(f => {
          if (f.level[0].tokens.includes(q)) {
            this.result.push({ level: 0, path: f.path });
          }
        });
      };
      const tSearch = (q) => {
        this.data.map(f => {
          if (f.level[1].tokens.includes(q)) {
            this.result.push({ level: 1, path: f.path });
          }
        });
      };
      const hSearch = (q) => {
        this.data.map(f => {
          for (let i = 2; i < 5; i++) {
            if (f.level[i].tokens.includes(q)) {
              this.result.push({ level: i, path: f.path });
            }
          }
        });
      };
      const lSearch = (q) => {
        this.data.map(f => {
          if (f.level[5].tokens.includes(q)) {
            this.result.push({ level: 5, path: f.path });
          }
        });
      };
      forThese.map(o => {
        switch (o.token) {
          case 'all':
            allSearch(o.qString);
            break;
          case 'filename':
            fSearch(o.qString);
            break;
          case 'tags':
            tSearch(o.qString);
            break;
          case 'headers':
            hSearch(o.qString);
            break;
          case 'links':
            lSearch(o.qString);
            break;
          default:
            throw new Error('InvalidQueryTokenError');
        }
      });

      return this.result;

    };

    return search;
  }
}



