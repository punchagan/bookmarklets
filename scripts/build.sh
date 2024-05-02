#!/bin/bash

set -euo pipefail

HERE=$(dirname $0)

bookmarklets () {
    bookmarklets=$(git ls-files src/*.js | sort -u)
    for bookmarklet in $bookmarklets;
    do
        code=$(grep -v "^\s*//" "${bookmarklet}" |tr "\n" " ")
        suffix="${bookmarklet/.js/}"
        prefix="${suffix/src\//}"
        title=$(echo "${prefix}" | sed 's/[^ _-]*/\u&/g' | tr "-" " ")
        a_tag="<a class='bml' href='${code}'>${title}</a>"
        docs=$(grep "^//" "${bookmarklet}" | sed "s#// ##g"|pandoc -f gfm --id-prefix "${prefix}-")
        printf "<div class='bookmarklet'><h3 id=%s>%s</h3>\n%s\n%s</div>" \
               "${prefix}" "${title}"  "${docs}" "${a_tag}"
    done
}

create_index () {
    style=$(cat styles.css)
    title="Bookmarklets"
    header=$(pandoc README.md --wrap=none | head -n 2)
    installation=$(pandoc README.md --wrap=none | tail --lines=+4)
    date=$(date)

    cat > index.html <<EOF
<!DOCTYPE html>
<html>
    <head>
        <title>${title}</title>
        <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
        <style>
         ${style}
        </style>
        <meta charset="utf-8">
    </head>
    <body>
      <header>${header}</header>
      <main>
        ${installation}
        $(bookmarklets)
      </main>
      <footer>
        <p>Last updated: ${date}<p>
        <p>Source: <a href="https://github.com/punchagan/bookmarklets">GitHub</a><p>
      </footer>
    </body>
</html>
EOF
}

pushd "${HERE}/.."
create_index
popd
