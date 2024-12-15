# Bookmarklets

A collection of my bookmarklets to automate various things in the browser

You can view them at [punchagan.github.io/bookmarklets](https://punchagan.github.io/bookmarklets)

#### Installation

- Drag and drop the bookmarklet link to your bookmarks toolbar
- If your bookmarklet toolbar is hidden, use `Ctrl+Shift+B` (on Firefox & Chrome) to make it visible
- On Firefox, you could also right click on the link and click "Bookmark Link"

#### Development

We use `dune` to build the `index.html` page with all the bookmarklets. You can
run `dune build --watch @index` to regenerate the `index.html` page while
editing any src/*.js file. 

You can also write tests and run them using `node tests/run.js`. See
`src/rudolph.js` for an example.

``` sh
ls src/*.js tests/*.js | entr node tests/run.js
```
