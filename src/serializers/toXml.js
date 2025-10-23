// src/serializers/toXml.js

// ---------- helpers ----------
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function textWithMarks(node) {
  if (!node) return "";
  if (node.type === "text") {
    let txt = esc(node.text || "");
    if (Array.isArray(node.marks)) {
      for (const m of node.marks) {
        if (m.type === "bold" || m.type === "strong") txt = `<b>${txt}</b>`;
        else if (m.type === "italic" || m.type === "em") txt = `<i>${txt}</i>`;
        else if (m.type === "underline") txt = `<u>${txt}</u>`;
        else if (m.type === "code") txt = `<code>${txt}</code>`;
        else if (m.type === "link" && m.attrs?.href) {
          const href = esc(m.attrs.href);
          const title = m.attrs.title ? ` title="${esc(m.attrs.title)}"` : "";
          txt = `<a href="${href}"${title}>${txt}</a>`;
        }
      }
    }
    return txt;
  }
  if (Array.isArray(node.content)) {
    return node.content.map(textWithMarks).join("");
  }
  return "";
}

// ---------- table helpers ----------
function serializeTableNode(node) {
  // TipTap table ecosystem (v2) nodes: table, tableRow, tableCell, tableHeader
  // We render a simple XML structure <table><row><cell>...</cell></row></table>
  const C = (node.content || []).map(serializeBlock).join("");

  switch (node.type) {
    case "table":
      return `<table>${C}</table>`;
    case "tableRow":
      return `<row>${C}</row>`;
    case "tableHeader":
      // Treat header cells like regular cells but with an attribute
      return `<cell header="true">${(node.content || [])
        .map(serializeBlock)
        .join("")}</cell>`;
    case "tableCell": {
      // Cell content may include paragraphs; keep them as-is inside <cell>
      const inner = (node.content || []).map(serializeBlock).join("");
      return `<cell>${inner}</cell>`;
    }
    default:
      return ""; // shouldn’t hit
  }
}

// ---------- block serializer ----------
function serializeBlock(node) {
  // Gracefully ignore nullish
  if (!node || typeof node !== "object") return "";

  // Known table-ish nodes first
  if (
    node.type === "table" ||
    node.type === "tableRow" ||
    node.type === "tableCell" ||
    node.type === "tableHeader"
  ) {
    return serializeTableNode(node);
  }

  const C = (node.content || []).map(serializeBlock).join("");

  switch (node.type) {
    case "paragraph":
      return `<p>${textWithMarks(node)}</p>`;

    case "heading": {
      // fallback heading → minimal <section><title>…</title>
      const title = textWithMarks(node) || "Untitled";
      return `<section><title>${title}</title></section>`;
    }

    case "blockquote":
      return `<blockquote>${C}</blockquote>`;

    case "bulletList":
      return `<list type="bullet">${C}</list>`;

    case "orderedList":
      return `<list type="ordered">${C}</list>`;

    case "listItem":
      return `<item>${C}</item>`;

    case "codeBlock": {
      const code = esc(node.textContent || "");
      return `<codeblock>${code}</codeblock>`;
    }

    case "horizontalRule":
      return `<hr/>`;

    case "hardBreak":
      return `<br/>`;

    // If a raw HTML table slipped through from paste (rare), treat generically
    case "thead":
    case "tbody":
    case "tr":
      // Flatten rows/cells
      return C;
    case "th":
    case "td":
      return `<cell>${C}</cell>`;

    default:
      // Fallbacks:
      if (node.type === "text") return textWithMarks(node);
      return C;
  }
}

// ---------- metadata helpers (unchanged from your last good version) ----------
function contributorsXml(list = []) {
  if (!list.length) return "";
  const items = list
    .map((c) => {
      const role = esc(c.role || "contributor");
      const given = esc(c.given || "");
      const family = esc(c.family || "");
      const email = c.email ? `<email>${esc(c.email)}</email>` : "";
      const orcid = c.orcid ? `<orcid>${esc(c.orcid)}</orcid>` : "";
      const uri = c.uri ? `<uri>${esc(c.uri)}</uri>` : "";
      const corresponding = c.corresponding ? ` corresponding="true"` : "";

      let aff = "";
      if (c.affiliation) {
        const a = c.affiliation;
        const attrs = [`unitCode="${esc(a.unitCode)}"`];
        if (a.committeeCode)
          attrs.push(`committeeCode="${esc(a.committeeCode)}"`);
        if (a.unitUri) attrs.push(`unitUri="${esc(a.unitUri)}"`);
        if (a.committeeUri) attrs.push(`committeeUri="${esc(a.committeeUri)}"`);
        if (a.orgId) attrs.push(`orgId="${esc(a.orgId)}"`);
        const country = a.country ? `<country>${esc(a.country)}</country>` : "";
        aff = `<affiliation ${attrs.join(" ")}>
  <org>Houses of the Oireachtas</org>
  <unit>${esc(a.unit)}</unit>
  ${country}
</affiliation>`;
      }

      return `<contrib role="${role}"${corresponding}>
  <name><given>${given}</given><family>${family}</family></name>
  ${aff}
  ${orcid}
  ${email}
  ${uri}
</contrib>`;
    })
    .join("\n");

  return `<contributors>\n${items}\n</contributors>`;
}

function keywordsXml(list = []) {
  if (!list.length) return "";
  return `<keywords>\n${list.map((k) => `  <keyword>${esc(k)}</keyword>`).join("\n")}\n</keywords>`;
}

function relatedXml(list = []) {
  if (!list.length) return "";
  const items = list
    .map((r) => `<item relation="${esc(r.relation)}" uri="${esc(r.uri)}"/>`)
    .join("\n");
  return `<related>\n${items}\n</related>`;
}

function dataLinksXml(list = []) {
  if (!list.length) return "";
  const items = list
    .map((d) => `<item label="${esc(d.label)}" uri="${esc(d.uri)}"/>`)
    .join("\n");
  return `<dataLinks>\n${items}\n</dataLinks>`;
}

// ---------- main ----------
export function pmJsonToXml(docJson, meta = {}) {
  const M = {
    schemaVersion: meta.schemaVersion || "researchDocument@0.2",
    title: meta.title || "Untitled",
    subtitle: meta.subtitle,
    abstract: meta.abstract,
    language: meta.language || "en",
    status: meta.status || "draft",
    version: meta.version,
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
    doi: meta.doi,
    series: meta.series,
    license: meta.license,
    keywords: meta.keywords || [],
    contributors: meta.contributors || [],
    related: meta.related || [],
    dataLinks: meta.dataLinks || [],
    publisher: meta.publisher,
    imprint: meta.imprint, // or meta.unit if you renamed—adjust here if needed
  };

  const body = (docJson?.content || [])
    .map((n) => {
      try {
        return serializeBlock(n);
      } catch (e) {
        // Never crash export; leave a breadcrumb
        return `<!-- unsupported node: ${esc(n?.type || "unknown")} (${esc(e?.message || String(e))}) -->`;
      }
    })
    .join("");

  const imprintStr = M.imprint
    ? (() => {
        const attrs = [`unitCode="${esc(M.imprint.unitCode)}"`];
        if (M.imprint.committeeCode)
          attrs.push(`committeeCode="${esc(M.imprint.committeeCode)}"`);
        if (M.imprint.unitUri)
          attrs.push(`unitUri="${esc(M.imprint.unitUri)}"`);
        if (M.imprint.committeeUri)
          attrs.push(`committeeUri="${esc(M.imprint.committeeUri)}"`);
        return `    <imprint ${attrs.join(" ")}>${esc(M.imprint.unit)}</imprint>\n`;
      })()
    : "";

  const seriesStr = M.series
    ? `    <series><name>${esc(M.series.name)}</name>${M.series.number ? `<number>${esc(M.series.number)}</number>` : ""}</series>\n`
    : "";

  const doiStr = M.doi ? `    <doi>${esc(M.doi)}</doi>\n` : "";
  const licenseStr = M.license
    ? `    <license>${esc(M.license)}</license>\n`
    : "";
  const subtitleStr = M.subtitle
    ? `    <subtitle>${esc(M.subtitle)}</subtitle>\n`
    : "";
  const abstractStr = M.abstract
    ? `    <abstract>${esc(M.abstract)}</abstract>\n`
    : "";
  const versionStr = M.version
    ? `    <version>${esc(M.version)}</version>\n`
    : "";
  const datePubStr = M.datePublished
    ? `    <datePublished>${esc(M.datePublished)}</datePublished>\n`
    : "";
  const dateModStr = M.dateModified
    ? `    <dateModified>${esc(M.dateModified)}</dateModified>\n`
    : "";
  const publisherStr = M.publisher
    ? `    <publisher>${esc(M.publisher)}</publisher>\n`
    : "";

  const keywordsStr = keywordsXml(M.keywords);
  const contributorsStr = contributorsXml(M.contributors);
  const relatedStr = relatedXml(M.related);
  const dataLinksStr = dataLinksXml(M.dataLinks);

  const metaXml = `  <metadata>
    <title>${esc(M.title)}</title>
${subtitleStr}${abstractStr}    <status>${esc(M.status)}</status>
    <language>${esc(M.language)}</language>
${versionStr}${datePubStr}${dateModStr}${doiStr}${seriesStr}${licenseStr}${publisherStr}${imprintStr}${keywordsStr ? "    " + keywordsStr.replace(/\n/g, "\n    ") + "\n" : ""}${contributorsStr ? "    " + contributorsStr.replace(/\n/g, "\n    ") + "\n" : ""}${relatedStr ? "    " + relatedStr.replace(/\n/g, "\n    ") + "\n" : ""}${dataLinksStr ? "    " + dataLinksStr.replace(/\n/g, "\n    ") + "\n" : ""}
  </metadata>`;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<researchDocument version="${esc(M.schemaVersion.split("@")[1] || "0.2")}" xml:lang="${esc(M.language)}">\n` +
    `${metaXml}\n` +
    `  <body>\n${body}\n  </body>\n` +
    `</researchDocument>`
  );
}
