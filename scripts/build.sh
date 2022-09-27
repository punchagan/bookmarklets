#!/bin/bash

set -euo pipefail

HERE=$(dirname $0)

bookmarklets () {
    bookmarklets=$(git ls-files *.js)
    for bookmarklet in $bookmarklets;
    do
        code=$(grep -v "//" "${bookmarklet}" |tr "\n" " ")
        title=$(echo "${bookmarklet}" | sed "s/\..*//g" | sed 's/[^ _-]*/\u&/g' | tr "-" " ")
        a_tag="<a href='${code}'>${title}</a>"
        docs=$(grep "^//" "${bookmarklet}" | sed "s#// ##g"|pandoc -f gfm)
        printf "<div class='bookmarklet'><h1>%s</h1>\n%s\n%s</div>" "${title}"  "${docs}" "${a_tag}"
    done
}

create_index () {
    style=$(cat styles.css)
    title="Bookmarklets"
    date=$(date)

    cat > index.html <<EOF
<!DOCTYPE html>
<meta charset="utf-8">
<html>
    <head>
        <title>${title}</title>
        <style>
         ${style}
        </style>
    </head>
    <body>
      <div class="content">
        <h1 class="header">${title}</h1>
        <p>Drag and Drop these bookmarklets into your browser bookmarks bar</p>
        <div class="bookmarklets">
          $(bookmarklets)
        </div>
        <footer>Last updated: ${date}</footer>
      </div>
    </body>
</html>
EOF
}

pushd "${HERE}/.."
create_index
popd
