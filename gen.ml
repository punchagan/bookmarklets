type bookmarklet = {
  filename : string;
  title : string;
  doc : string;
  code : string;
}

let ( / ) = Filename.concat

let to_title name =
  name |> Filename.remove_extension |> String.split_on_char '-'
  |> List.map String.capitalize_ascii
  |> String.concat " "

let wrap_code code =
  if code |> String.starts_with ~prefix:"javascript:" then code
  else Printf.sprintf "javascript:(async () => {\n%s\nmain()})();" code

let process_bookmarklet ~src_dir filename =
  let path = src_dir / filename in
  let title = to_title filename in
  let lines = In_channel.with_open_text path In_channel.input_lines in
  let code =
    lines
    |> List.filter (fun line ->
           (* FIXME: It would be nice to remove comments at the end of lines,
              since they break the page generation *)
           line |> String.trim |> String.starts_with ~prefix:"//" |> not)
    |> String.concat "\n" |> String.trim |> wrap_code
  in
  let doc_md =
    let non_doc_idx =
      List.find_index
        (fun s -> not (String.trim s = "" || String.starts_with ~prefix:"//" s))
        lines
      |> Option.value ~default:(List.length lines)
    in
    lines
    |> List.filteri (fun i _ -> i < non_doc_idx)
    |> List.map (Str.replace_first (Str.regexp "/+ ") "")
    |> String.concat "\n"
  in
  let doc = Cmarkit.Doc.of_string doc_md |> Cmarkit_html.of_doc ~safe:true in
  { filename; title; code; doc }

let make_head page_title =
  let open Tyxml.Html in
  let simple_css_url = "https://cdn.simplecss.org/simple.min.css" in
  let bml_style =
    {|
        .bml {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50px;
            border: 1px dashed;
            margin: 1em 0;
        }
      |}
  in
  head
    (title (txt page_title))
    [
      link ~rel:[ `Stylesheet ] ~href:simple_css_url ();
      style [ txt bml_style ];
      meta ~a:[ a_charset "UTF-8" ] ();
      meta
        ~a:
          [
            a_name "viewport"; a_content "width=device-width, initial-scale=1.0";
          ]
        ();
    ]

let bml_html { title = bm_title; filename; code = bm_code; doc } =
  let open Tyxml.Html in
  let bml_id = Filename.remove_extension filename in
  let bml =
    div
      ~a:[ a_class [ "bookmarklet" ] ]
      [
        h3 ~a:[ a_id bml_id ] [ txt bm_title ];
        (* FIXME: Can Doc.t be converted to Tyxml? *)
        Unsafe.data doc;
        a ~a:[ a_class [ "bml" ]; a_href bm_code ] [ txt bm_title ];
      ]
  in
  bml

let process_readme path =
  let open Cmarkit in
  (* Helper function to find and render specific sections by heading *)
  let extract_section ?(include_header = false) heading_name doc =
    let rec find_sections acc = function
      | [] -> List.rev acc
      | (Block.Heading (heading, _) as block) :: blocks
        when Inline.to_plain_text ~break_on_soft:true
               (Block.Heading.inline heading)
             |> List.concat |> String.concat "" |> String.trim = heading_name ->
          let rec collect_content content = function
            | [] -> List.rev content
            | Block.Heading (_next_heading, _) :: _ -> content
            | block :: rest -> collect_content (block :: content) rest
          in
          let content_blocks, remaining_blocks =
            (collect_content [] blocks, blocks)
          in
          let content = find_sections (content_blocks @ acc) remaining_blocks in
          if include_header then block :: content else content
      | _ :: rest -> find_sections acc rest
    in
    match Doc.block doc with
    | Block.Blocks (blocks, _) -> find_sections [] blocks
    | single_block -> find_sections [] [ single_block ]
  in

  (* Parse the Markdown file into a Cmarkit document *)
  let markdown = In_channel.with_open_text path In_channel.input_all in
  let doc = Doc.of_string markdown in

  (* Extract relevant sections *)
  let description_blocks = extract_section "Bookmarklets" doc in
  let installation_blocks =
    extract_section ~include_header:true "Installation" doc
  in

  (* Render the extracted sections into HTML *)
  let render_blocks blocks =
    blocks
    |> List.map (fun block ->
           let sub_doc = Doc.make block in
           Cmarkit_html.of_doc ~safe:true sub_doc)
    |> String.concat "\n"
  in
  let description_html = render_blocks description_blocks in
  let installation_html = render_blocks installation_blocks in

  (* Combine the sections into the final HTML *)
  String.concat "\n" [ description_html; installation_html ]

let make_footer () =
  let open Tyxml.Html in
  let d = Ptime_clock.now () |> Ptime.to_rfc3339 in
  footer
    [
      p [ txt (Printf.sprintf "Last updated: %s" d) ];
      p
        [
          txt "Source: ";
          a
            ~a:[ a_href "https://github.com/punchagan/bookmarklets" ]
            [ txt "GitHub" ];
        ];
    ]

let generate_html src_dir =
  let open Tyxml.Html in
  let bookmarklets =
    Sys.readdir src_dir |> Array.to_list
    |> List.filter (fun name -> Filename.extension name = ".js")
    |> List.sort Stdlib.compare
    |> List.map (process_bookmarklet ~src_dir)
  in
  let readme_path = src_dir / ".." / "README.md" in
  let page_title = "Bookmarklets" in
  let body =
    [
      header [ h1 ~a:[ a_id "bookmarklets" ] [ txt page_title ] ];
      Unsafe.data (process_readme readme_path);
    ]
    @ List.map bml_html bookmarklets
    @ [ make_footer () ]
    |> body
  in

  let content = html (make_head page_title) body in
  let output = Format.asprintf "%a\n" (Tyxml.Html.pp ~indent:true ()) content in
  let index_path = src_dir / ".." / "index.html" in
  Out_channel.with_open_text index_path (fun oc ->
      Out_channel.output_string oc output);
  ()

let () = generate_html "./src"
