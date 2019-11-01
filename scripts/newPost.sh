#!/usr/bin/env bash

title=${1:-'untitled'}

if [[ ! "${title}" =~ md$ ]]; then
  title="${title}.md";
fi

title_sans_cruft=$(echo ${title} | sed -e 's/.md$//' -e 's/WIP//');

cat << EOF > "./articles/${title}"
# ${title_sans_cruft} 
<!-- Synopsis Start -->

<!-- Synopsis End -->

<!-- Tags: -->
<!-- Published: -->
<!-- Updated: -->
<!-- Status: WIP -->
EOF