#!/usr/bin/env bash

title=${1:-'untitled'}

if [[ ! "${title}" =~ md$ ]]; then
  title="${title}.md";
fi

cat << EOF > "./posts/${title}"
# 
<!-- Synopsis Start -->


<!-- Synopsis End -->

<!-- Tags: -->
EOF