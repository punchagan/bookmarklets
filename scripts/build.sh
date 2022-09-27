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
        a_tag="<a class='bml' href='${code}'>${title}</a>"
        docs=$(grep "^//" "${bookmarklet}" | sed "s#// ##g"|pandoc -f gfm --id-prefix "${prefix}-")
        printf "<div class='bookmarklet'><h3 id=%s>%s</h3>\n%s\n%s</div>" \
               "${prefix}" "${title}"  "${docs}" "${a_tag}"
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
        <p>Some bookmarklets that I collected over the years</p>
      </header>
      <main>
        <h4>Installation</h4>
        <p>
          <ul>
             <li>Drag and drop the bookmarklet link to your bookmarks toolbar</li>
             <li>If your bookmarklet toolbar is hidden, use <kbd>Ctrl+Shift+B</kbd> (on Firefox & Chrome) to make it visible</li>
             <li>On Firefox, you could also right click on the link and click "Bookmark Link"</li>
          </ul>
        <p>
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
