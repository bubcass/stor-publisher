// src/serializers/toDocbook.js
// ProseMirror JSON + metadata → DocBook 5 <article> (Oireachtas-enriched)
// Safe for tables and unknown nodes

/* ----------------- helpers ----------------- */
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function slugifyTitle(title = "") {
  return String(title)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase()
    .slice(0, 60);
}

function makeUniqueIdFactory() {
  const used = new Set();
  return (base) => {
    let id = base || "section";
    if (!used.has(id)) {
      used.add(id);
      return id;
    }
    let i = 2;
    while (used.has(`${id}-${i}`)) i++;
    const unique = `${id}-${i}`;
    used.add(unique);
    return unique;
  };
}

/* ------------- inline → DocBook ------------- */
function inlineText(node) {
  if (!node) return "";
  if (node.type === "text") {
    let t = esc(node.text || "");
    if (Array.isArray(node.marks)) {
      for (const m of node.marks) {
        if (m.type === "bold" || m.type === "strong")
          t = `<emphasis role="strong">${t}</emphasis>`;
        else if (m.type === "italic" || m.type === "em")
          t = `<emphasis>${t}</emphasis>`;
        else if (m.type === "underline")
          t = `<emphasis role="underline">${t}</emphasis>`;
        else if (m.type === "code") t = `<code>${t}</code>`;
        else if (m.type === "link" && m.attrs?.href) {
          const href = esc(m.attrs.href);
          const title = m.attrs.title
            ? ` xlink:title="${esc(m.attrs.title)}"`
            : "";
          t = `<ulink url="${href}"${title}>${t}</ulink>`;
        }
      }
    }
    return t;
  }
  if (Array.isArray(node.content)) return node.content.map(inlineText).join("");
  return "";
}

/* ------------- blocks → DocBook -------------- */
function listToDocBook(node) {
  const tag = node.type === "orderedList" ? "orderedlist" : "itemizedlist";
  const items = (node.content || [])
    .map((li) => {
      const parts = (li.content || [])
        .map((ch) => {
          if (ch.type === "paragraph") return `<para>${inlineText(ch)}</para>`;
          if (ch.type === "bulletList" || ch.type === "orderedList")
            return listToDocBook(ch);
          return "";
        })
        .join("");
      return `<listitem>${parts}</listitem>`;
    })
    .join("");
  return `<${tag}>${items}</${tag}>`;
}

function tableToDocBook(node) {
  // TipTap v2: table → [tableRow]; tableRow → [tableCell|tableHeader]
  const bodyRows = (node.content || [])
    .filter((r) => r && r.type === "tableRow")
    .map((r) => {
      const entries = (r.content || [])
        .map((c) => {
          const paras = (c.content || [])
            .map((ch) => {
              if (ch.type === "paragraph")
                return `<para>${inlineText(ch)}</para>`;
              if (ch.type === "bulletList" || ch.type === "orderedList")
                return listToDocBook(ch);
              if (ch.type === "codeBlock")
                return `<programlisting>${esc(ch.textContent || "")}</programlisting>`;
              return `<para>${inlineText(ch)}</para>`;
            })
            .join("");
          const head = c.type === "tableHeader";
          return head
            ? `<entry role="header">${paras}</entry>`
            : `<entry>${paras}</entry>`;
        })
        .join("");
      return `<row>${entries}</row>`;
    })
    .join("");

  return `<informaltable>
  <tbody>
${bodyRows
  .split("\n")
  .map((l) => "    " + l)
  .join("\n")}
  </tbody>
</informaltable>`;
}

function pmToSections(doc) {
  const blocks = doc?.content || [];
  const root = { level: 0, title: null, children: [], paras: [], extras: [] };
  const stack = [root];
  const cur = () => stack[stack.length - 1];

  for (const n of blocks) {
    try {
      if (n.type === "heading") {
        const lvl = Math.max(1, Math.min(6, n.attrs?.level || 1));
        while (stack.length && stack[stack.length - 1].level >= lvl)
          stack.pop();
        const sec = {
          level: lvl,
          title: inlineText(n) || "Untitled",
          children: [],
          paras: [],
          extras: [],
        };
        cur().children.push(sec);
        stack.push(sec);
        continue;
      }
      if (n.type === "paragraph") {
        cur().paras.push(`<para>${inlineText(n)}</para>`);
        continue;
      }
      if (n.type === "blockquote") {
        const ps = (n.content || [])
          .map((ch) => `<para>${inlineText(ch)}</para>`)
          .join("");
        cur().extras.push(`<blockquote>${ps}</blockquote>`);
        continue;
      }
      if (n.type === "bulletList" || n.type === "orderedList") {
        cur().extras.push(listToDocBook(n));
        continue;
      }
      if (n.type === "codeBlock") {
        cur().extras.push(
          `<programlisting>${esc(n.textContent || "")}</programlisting>`,
        );
        continue;
      }
      if (n.type === "horizontalRule") {
        cur().extras.push(`<literallayout>—</literallayout>`);
        continue;
      }
      if (n.type === "table") {
        cur().extras.push(tableToDocBook(n));
        continue;
      }
      if (n.type === "text") {
        cur().paras.push(`<para>${inlineText(n)}</para>`);
        continue;
      }
    } catch (e) {
      cur().extras.push(
        `<!-- block error: ${esc(e?.message || String(e))} -->`,
      );
    }
  }
  return root;
}

function renderSectionsXml(root) {
  const uniq = makeUniqueIdFactory();
  function sectionXml(sec) {
    const base = sec.title ? slugifyTitle(sec.title) : "section";
    const idAttr = ` xml:id="${uniq(base)}"`;
    const body = [
      sec.title != null ? `<title>${esc(sec.title)}</title>` : "",
      ...sec.paras,
      ...sec.extras,
      ...sec.children.map(sectionXml),
    ].join("\n");
    return `<section${idAttr}>\n${body}\n</section>`;
  }
  return root.children.map(sectionXml).join("\n");
}

/* ------------- metadata helpers -------------- */
function peopleXml(list = [], tagName) {
  if (!list?.length) return "";
  return list
    .map((p) => {
      const name = esc(
        [p.given, p.family].filter(Boolean).join(" ") || p.name || "",
      );
      const role = p.role ? `<role>${esc(p.role)}</role>` : "";
      const aff = p.affiliation?.unit
        ? `<affiliation>${esc(p.affiliation.unit)}</affiliation>`
        : p.affiliation?.org
          ? `<affiliation>${esc(p.affiliation.org)}</affiliation>`
          : "";
      const uri = p.uri
        ? `<uri>${esc(p.uri)}</uri>`
        : p.orcid
          ? `<uri>${esc(p.orcid)}</uri>`
          : "";
      return `<${tagName}>
  <personname>${name}</personname>
  ${role}
  ${aff}
  ${uri}
</${tagName}>`;
    })
    .join("\n");
}

function seriesXml(series) {
  if (!series?.name) return "";
  const number =
    series.number != null
      ? `<number>${esc(String(series.number))}</number>`
      : "";
  const total =
    series.total != null
      ? `<totalseries>${esc(String(series.total))}</totalseries>`
      : "";
  return `<seriesinfo>
  <title>${esc(series.name)}</title>
  ${number}
  ${total}
</seriesinfo>`;
}

function keywordsetXml(list = []) {
  if (!list.length) return "";
  const items = list.map((k) => `<keyword>${esc(k)}</keyword>`).join("\n");
  return `<keywordset>\n${items}\n</keywordset>`;
}

function unitRemark(unit) {
  if (!unit?.unit) return "";
  const bits = [
    `Unit: ${unit.unit}`,
    unit.unitCode ? `code=${unit.unitCode}` : null,
    unit.committeeCode ? `committee=${unit.committeeCode}` : null,
    unit.unitUri ? `unitUri=${unit.unitUri}` : null,
    unit.committeeUri ? `committeeUri=${unit.committeeUri}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  return `<remark><para>${esc(bits)}</para></remark>`;
}

function oorUnitXml(unit) {
  if (!unit?.unit) return "";
  const attrs = [
    unit.unitCode ? `unitCode="${esc(unit.unitCode)}"` : null,
    unit.committeeCode ? `committeeCode="${esc(unit.committeeCode)}"` : null,
    unit.unitUri ? `unitUri="${esc(unit.unitUri)}"` : null,
    unit.committeeUri ? `committeeUri="${esc(unit.committeeUri)}"` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const attrStr = attrs ? " " + attrs : "";
  return `<oor:unit${attrStr}>${esc(unit.unit)}</oor:unit>`;
}

/* ----------------- main ----------------- */
export function pmToDocbookArticle(pmJson, meta = {}) {
  const title = meta.title || "Untitled research document";
  const subtitle = meta.subtitle;
  const lang = meta.language || "en";

  const all = Array.isArray(meta.contributors) ? meta.contributors : [];
  const authors = all.filter(
    (c) => (c.role || "author").toLowerCase() === "author",
  );
  const others = all.filter((c) => (c.role || "").toLowerCase() !== "author");

  const infoParts = [
    `<title>${esc(title)}</title>`,
    subtitle ? `<subtitle>${esc(subtitle)}</subtitle>` : "",
    peopleXml(authors, "author"),
    others.length
      ? `\n<remark>\n  <para>Contributors:</para>\n  <itemizedlist>\n${others
          .map((c) => {
            const name = esc(
              [c.given, c.family].filter(Boolean).join(" ") || c.name || "",
            );
            const role = c.role ? ` (${esc(c.role)})` : "";
            const aff =
              c.affiliation?.unit || c.affiliation?.org
                ? ` — ${esc(c.affiliation.unit || c.affiliation.org)}`
                : "";
            const uri =
              c.uri || c.orcid
                ? ` (<ulink url="${esc(c.uri || c.orcid)}">profile</ulink>)`
                : "";
            return `    <listitem><para><emphasis>${name}</emphasis>${role}${aff}${uri}</para></listitem>`;
          })
          .join("\n")}\n  </itemizedlist>\n</remark>`
      : "",
    meta.audience ? `<keyword>${esc(meta.audience)}</keyword>` : "",
    meta.doi
      ? `<pubidentifier type="doi">${esc(meta.doi)}</pubidentifier>`
      : "",
    meta.uri ? `<uri>${esc(meta.uri)}</uri>` : "",
    meta.identifier?.type && meta.identifier?.value
      ? `<pubidentifier type="${esc(meta.identifier.type)}">${esc(meta.identifier.value)}</pubidentifier>`
      : "",
    seriesXml(meta.series),
    meta.datePublished || meta.date
      ? `<date>${esc(String(meta.datePublished || meta.date).slice(0, 10))}</date>`
      : "",
    meta.version
      ? `<revhistory><revision><revnumber>${esc(meta.version)}</revnumber>${
          meta.datePublished || meta.date
            ? `<date>${esc(String(meta.datePublished || meta.date).slice(0, 10))}</date>`
            : ""
        }${meta.status ? `<revremark>${esc(meta.status)}</revremark>` : ""}</revision></revhistory>`
      : "",
    meta.publisher
      ? `<publisher><publishername>${esc(meta.publisher)}</publishername></publisher>`
      : "",
    meta.license
      ? `<legalnotice><para>${esc(meta.license)}</para></legalnotice>`
      : "",
    meta.abstract ? `<abstract>${esc(meta.abstract)}</abstract>` : "",
    keywordsetXml(meta.keywords || []),
    oorUnitXml(meta.unit),
    unitRemark(meta.unit),
  ]
    .filter(Boolean)
    .join("\n");

  const tree = pmToSections(pmJson);
  const sectionsXml = tree.children.length
    ? renderSectionsXml(tree)
    : (() => {
        const id = slugifyTitle(title) || "section";
        return `<section xml:id="${id}"><title>${esc(title)}</title><para></para></section>`;
      })();

  return `<?xml version="1.0" encoding="UTF-8"?>
<article xmlns="http://docbook.org/ns/docbook"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns:xlink="http://www.w3.org/1999/xlink"
         xmlns:oor="https://oireachtas.ie/ns/docbook-oireachtas"
         version="5.0"
         xml:lang="${esc(lang)}"
         xsi:schemaLocation="http://docbook.org/ns/docbook http://docbook.org/xml/5.0/rng/docbook.rng">
  <info>
${infoParts
  .split("\n")
  .map((l) => "    " + l)
  .join("\n")}
  </info>

${sectionsXml}
</article>`;
}
