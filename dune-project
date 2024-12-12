(lang dune 3.16)

(name bookmarklets)

(generate_opam_files true)

(source
 (github punchagan/bookmarklets))

(authors "Puneeth Chaganti")

(maintainers "Puneeth Chaganti")

(license "GPL-3.0-only")

(package
 (name bookmarklets)
 (synopsis
  "A collection of my bookmarklets to automate various things in the browser")
 (description "A longer description")
 (depends dune cmarkit tyxml tyxml-ppx))

; See the complete stanza docs at https://dune.readthedocs.io/en/stable/reference/dune-project/index.html
