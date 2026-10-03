// Copies the pdf.js worker bundled with pdfjs-dist (a dependency of
// react-pdf) into /public so it can be served same-origin. This lets us
// keep a strict Content-Security-Policy (no third-party script/worker
// hosts) while still rendering PDFs with react-pdf in the newsletter
// viewer.
const fs = require("fs");
const path = require("path");

const src = path.join(
  __dirname,
  "..",
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs"
);
const destDir = path.join(__dirname, "..", "public", "pdf-worker");
const dest = path.join(destDir, "pdf.worker.min.mjs");

if (!fs.existsSync(src)) {
  console.warn("[copy-pdf-worker] pdfjs-dist worker not found, skipping:", src);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("[copy-pdf-worker] copied pdf.worker.min.mjs -> public/pdf-worker/");
