#!/usr/bin/env bash

if [ -e ./node_modules/.bin/nodemon ]; then
  n=$(ps auxwww | grep -i nodemon | grep -v grep | wc -l);
  s=$(ps auxwww | grep scripts\/server | grep -v grep | wc -l);

  if [[ $s -eq 0 ]]; then
    echo "starting server"
    bash -c "/usr/bin/env node ./scripts/server.js &"
  else
    echo "server running."
  fi
  if [[ $n -eq 0 ]]; then
    echo "starting nodemon"
    ./node_modules/.bin/nodemon -e pug,scss --watch posts --watch includes ./scripts/build.sh -- &
  else
    echo "nodemon running."
  fi
else
  echo "nope"
fi