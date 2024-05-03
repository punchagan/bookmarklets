#!/bin/bash

set -euo pipefail

HERE=$(dirname $0)

REPO_URL="https://github.com/punchagan/bookmarklets"

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
        gh_url="${REPO_URL}/tree/main/${bookmarklet}"
        source="<a href=\"${gh_url}\"><small>Source</small></a>"
        printf "<div class='bookmarklet'><h3 id=%s>%s</h3>\n%s\n%s\n%s</div>" \
            "${prefix}" "${title}" "${docs}" "${a_tag}" "${source}"
    done
}

create_index () {
    style=$(cat styles.css)
    title="Bookmarklets"
    readme=$(pandoc README.md --wrap=none)
    header=$(echo "${readme}" | head -n 2)
    installation=$(echo "${readme}" | tail --lines=+4)
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
        <div class="notice">
          ${installation}
        </div>
        $(bookmarklets)
      </main>
      <footer>
        <p>Last updated: ${date}<p>
        <p>Source: <a href="${REPO_URL}">GitHub</a><p>
      </footer>
    </body>
</html>
EOF
}

pushd "${HERE}/.."
create_index
popd
