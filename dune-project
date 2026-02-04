(lang dune 3.16)

(name bookmarklets)

(source
 (github punchagan/bookmarklets))

(authors "Puneeth Chaganti")

(maintainers "Puneeth Chaganti")

(license "GPL-3.0-only")

(package
 (name bookmarklets)
 (synopsis "A collection of bookmarklets.")
 (description
  "A collection of my bookmarklets to automate various things in the browser.")
 (depends ocaml cmarkit tyxml ptime tyxml-ppx))

; See the complete stanza docs at https://dune.readthedocs.io/en/stable/reference/dune-project/index.html
