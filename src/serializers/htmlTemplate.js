export function wrapHtml(bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Exported Document</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;}
    figure{margin:1rem 0}
    figcaption{font-size:.9rem;color:#555}
    pre{background:#f7f7f7;padding:1rem;border-radius:8px;overflow:auto}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}