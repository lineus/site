#!/usr/bin/env bash

n=$(ps auxwww | grep -i nodemon | grep -v grep | awk '{ print $2 }');
s=$(ps auxwww | grep scripts\/server | grep -v grep | awk '{ print $2 }');

deadN=$(kill ${n} 2>/dev/null; echo $?);
deadS=$(kill ${s} 2>/dev/null; echo $?);

if [ $deadN -gt 0 ];then
  echo "failed to kill nodemon: ${n}"
fi

if [ $deadS -gt 0 ];then
  echo "failed to kill server: ${s}"
fi