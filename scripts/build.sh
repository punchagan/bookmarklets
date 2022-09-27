#!/bin/bash

set -euo pipefail

HERE=$(dirname $0)

bookmarklets () {
    bookmarklets=$(git ls-files *.js | sort -u)
    for bookmarklet in $bookmarklets;
    do
        code=$(grep -v "//" "${bookmarklet}" |tr "\n" " ")
        prefix="${bookmarklet/.js/}"
        title=$(echo "${prefix}" | sed 's/[^ _-]*/\u&/g' | tr "-" " ")
        a_tag="<a href='${code}'>${title}</a>"
        docs=$(grep "^//" "${bookmarklet}" | sed "s#// ##g"|pandoc -f gfm --id-prefix "${prefix}-")
        printf "<div class='bookmarklet'><h3>%s</h3>\n%s\n%s</div>" "${title}"  "${docs}" "${a_tag}"
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
        <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
        <style>
         ${style}
        </style>
    </head>
    <body>
      <header>
        <h1 class="header">${title}</h1>
        <p>Drag and Drop the bookmarklet links into your browser's bookmarks toolbar</p>
      </header>
      <main>
        $(bookmarklets)
      </main>
      <footer><p>Last updated: ${date}<p></footer>
    </body>
</html>
EOF
}

pushd "${HERE}/.."
create_index
popd
