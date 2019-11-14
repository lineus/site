#!/usr/bin/env node
'use strict';

const { MongoClient } = require('mongodb');

const { ATLASSRV } = require(`${process.env.HOME}/.env`);
const OPTS = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const client = new MongoClient(ATLASSRV, OPTS);
client.connect((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const visitors = client.db('SiteMetrics').collection('visitors');
  visitors.deleteMany({}, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    client.close();
  });

});
