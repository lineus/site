'use strict';

if (typeof exports !== 'undefined') {
  module.exports = {
    searchFactory
  };
}

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
        let re = new RegExp(`.*${q}.*`);
        this.data.map(f => {
          for (let i = 0; i < 6; i++) {
            let index = f.level[i].tokens.findIndex(matches);
            if (index > -1) {
              this.result.push({ level: i, path: f.path });
            }
          }
        });
        function matches(el) {
          return re.test(el);
        }
      };

      const fSearch = (q) => {
        let re = new RegExp(`.*${q}.*`);
        this.data.map(f => {
          let index = f.level[0].tokens.findIndex(matches);
          if (index > -1) {
            this.result.push({ level: 0, path: f.path });
          }
        });
        function matches(el) {
          return re.test(el);
        }
      };

      const tSearch = (q) => {
        let re = new RegExp(`.*${q}.*`);
        this.data.map(f => {
          let index = f.level[1].tokens.findIndex(matches);
          if (index > -1) {
            this.result.push({ level: 1, path: f.path });
          }
        });
        function matches(el) {
          return re.test(el);
        }
      };

      const hSearch = (q) => {
        let re = new RegExp(`.*${q}.*`);
        this.data.map(f => {
          for (let i = 2; i < 5; i++) {
            let index = f.level[i].tokens.findIndex(matches);
            if (index > -1) {
              this.result.push({ level: i, path: f.path });
            }
          }
        });
        function matches(el) {
          return re.test(el);
        }
      };

      const lSearch = (q) => {
        let re = new RegExp(`.*${q}.*`);
        this.data.map(f => {
          let index = f.level[5].tokens.findIndex(matches);
          if (index > -1) {
            this.result.push({ level: 5, path: f.path });
          }
        });
        function matches(el) {
          return re.test(el);
        }
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

      let temp = [...this.result];
      this.result = [];
      return temp;

    };

    return search;
  }
}



