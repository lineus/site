#!/usr/bin/env bash

if [ -e ./node_modules/.bin/nodemon ]; then
  n=$(ps auxwww | grep -i nodemon | grep -v grep | wc -l);
  b=$(ps auxwww | grep -i browser-sync | grep -v grep | wc -l);

  if [[ $b -eq 0 ]]; then
    echo "starting server"
    bash -c "./node_modules/.bin/browser-sync start --server --files "docs/*" --ss ./docs -- &"
  else
    echo "server running."
  fi
  if [[ $n -eq 0 ]]; then
    echo "starting nodemon"
    ./node_modules/.bin/nodemon -e js,md,pug,scss --watch posts --watch includes ./scripts/build.sh -- &
  else
    echo "nodemon running."
  fi
else
  echo "nope"
fi