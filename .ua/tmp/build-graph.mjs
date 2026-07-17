import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ua = path.join(root, ".ua");
const scan = JSON.parse(fs.readFileSync(path.join(ua, "intermediate", "scan-result.json"), "utf8"));
const commit = process.argv[2] || "unknown";
const now = new Date().toISOString();

const posix = (p) => p.replaceAll("\\", "/");
const exists = new Set(scan.files.map((f) => f.path));
const nodeType = (f) => {
  if (f.fileCategory === "docs") return "document";
  if (f.fileCategory === "config") return "config";
  return "file";
};
const idFor = (file) => `${nodeType(file)}:${file.path}`;
const idForPath = (p) => {
  const f = scan.files.find((x) => x.path === p);
  return f ? idFor(f) : `file:${p}`;
};
const nodes = [];
const edges = [];
const addEdge = (source, target, type, weight = 0.6, description = "") => {
  if (source === target) return;
  edges.push({ source, target, type, weight, description });
};

for (const file of scan.files) {
  const type = nodeType(file);
  const summaryByType = {
    document: `Documentation file for the project: ${file.path}.`,
    config: `Configuration or structured data file used by the site: ${file.path}.`,
    file: `Project file in ${file.language || "unknown"}: ${file.path}.`
  };
  const tags = [file.fileCategory, file.language].filter(Boolean);
  nodes.push({
    id: idFor(file),
    type,
    name: path.basename(file.path),
    filePath: file.path,
    summary: summaryByType[type],
    tags,
    complexity: file.sizeLines > 300 ? "complex" : file.sizeLines > 80 ? "moderate" : "simple"
  });
}

const jsFiles = scan.files.filter((f) => f.language === "javascript");
for (const file of jsFiles) {
  const abs = path.join(root, file.path);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, "utf8");
  const sourceId = idFor(file);
  for (const match of text.matchAll(/import\s+(?:[^"']+\s+from\s+)?["']([^"']+)["']/g)) {
    const spec = match[1];
    if (!spec.startsWith(".")) continue;
    const target = posix(path.normalize(path.join(path.dirname(file.path), spec)));
    if (exists.has(target)) addEdge(sourceId, idForPath(target), "imports", 0.7, `${file.path} imports ${target}.`);
  }
  for (const match of text.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_$]+)/g)) {
    const fnId = `function:${file.path}:${match[1]}`;
    nodes.push({
      id: fnId,
      type: "function",
      name: match[1],
      filePath: file.path,
      summary: `Exported JavaScript symbol ${match[1]} from ${file.path}.`,
      tags: ["export", "javascript"],
      complexity: "moderate"
    });
    addEdge(sourceId, fnId, "contains", 1, `${file.path} contains ${match[1]}.`);
    addEdge(fnId, sourceId, "exports", 0.8, `${match[1]} is exported by ${file.path}.`);
  }
  if (text.includes("fetch(DATA_URL")) addEdge(sourceId, idForPath("data/site-content.json"), "reads_from", 0.7, "Loads site content JSON.");
  if (file.path === "_worker.js") addEdge(sourceId, idForPath("wrangler.jsonc"), "configures", 0.6, "Cloudflare worker behavior is deployed with Wrangler config.");
}

for (const file of scan.files.filter((f) => f.language === "html")) {
  const abs = path.join(root, file.path);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, "utf8");
  const sourceId = idFor(file);
  if (text.includes("/assets/css/main.css")) addEdge(sourceId, idForPath("assets/css/main.css"), "depends_on", 0.6, "Page uses the shared stylesheet.");
  if (text.includes("/assets/js/app.js")) addEdge(sourceId, idForPath("assets/js/app.js"), "depends_on", 0.6, "Page boots the modular JavaScript app.");
  if (text.includes("/data/site-content.json") || text.includes("site-content.json")) addEdge(sourceId, idForPath("data/site-content.json"), "reads_from", 0.6, "Page content is hydrated from shared content data.");
}

addEdge(idForPath("assets/js/app.js"), idForPath("data/site-content.json"), "reads_from", 0.7, "Application entry point loads site content.");
addEdge(idForPath("README.md"), idForPath("data/site-content.json"), "documents", 0.5, "README documents the content data workflow.");
addEdge(idForPath("sitemap.xml"), idForPath("data/site-content.json"), "related", 0.5, "Sitemap paths should match route definitions.");

const layerDefs = [
  ["layer:edge-runtime", "Edge Runtime", "Cloudflare worker and deployment configuration.", ["_worker.js", "wrangler.jsonc", ".wrangler/cache/wrangler-account.json"]],
  ["layer:application-shells", "Application Shells", "Localized HTML shells and standalone pages served to visitors.", scan.files.filter((f) => f.language === "html" && !f.path.startsWith("archive/")).map((f) => f.path)],
  ["layer:client-application", "Client Application", "Modular browser JavaScript that loads data, renders routes, and handles interactions.", scan.files.filter((f) => f.path.startsWith("assets/js/")).map((f) => f.path)],
  ["layer:content-and-assets", "Content And Assets", "Shared CSS, structured content, sitemap, and static control files.", ["assets/css/main.css", "data/site-content.json", "sitemap.xml", "robot.txt", ".assetsignore", ".nojekyll"]],
  ["layer:documentation-and-archive", "Documentation And Archive", "Project documentation, commit notes, generated ignore file, and older archived pages.", scan.files.filter((f) => (f.fileCategory === "docs" && f.path !== "robot.txt") || f.path.startsWith("archive/") || f.path.startsWith(".ua/")).map((f) => f.path)]
];
const nodeIds = new Set(nodes.map((n) => n.id));
const layers = layerDefs.map(([id, name, description, paths]) => ({
  id, name, description,
  nodeIds: [...new Set(paths.map(idForPath).filter((id) => nodeIds.has(id)))]
}));

const tour = [
  { order: 1, title: "Project Overview", description: "Start with the README for the portfolio site's purpose, deployment notes, and content workflow.", nodeIds: [idForPath("README.md")] },
  { order: 2, title: "Static Entry Shells", description: "Review the root and localized HTML shells that load the shared CSS, data, and JavaScript application.", nodeIds: [idForPath("index.html"), idForPath("es/index.html"), idForPath("en/index.html")] },
  { order: 3, title: "Client Boot Sequence", description: "Follow the browser application entry point as it composes content loading, locale, rendering, routing, and UI modules.", nodeIds: [idForPath("assets/js/app.js"), idForPath("assets/js/core/content-loader.js"), idForPath("assets/js/core/router.js"), idForPath("assets/js/core/renderer.js")] },
  { order: 4, title: "Content Source", description: "Inspect the shared JSON content and sitemap relationship that drive localized page content and SEO routes.", nodeIds: [idForPath("data/site-content.json"), idForPath("sitemap.xml")] },
  { order: 5, title: "Deployment Runtime", description: "Finish with the Cloudflare worker and Wrangler config that serve static assets and language fallbacks.", nodeIds: [idForPath("_worker.js"), idForPath("wrangler.jsonc")] }
];

const dedupNodes = [...new Map(nodes.map((n) => [n.id, n])).values()];
const validIds = new Set(dedupNodes.map((n) => n.id));
const dedupEdges = [...new Map(edges
  .filter((e) => validIds.has(e.source) && validIds.has(e.target))
  .map((e) => [`${e.source}|${e.target}|${e.type}`, e])).values()];

const graph = {
  version: "1.0.0",
  project: {
    name: "joe",
    languages: [...new Set(scan.files.map((f) => f.language).filter(Boolean))],
    frameworks: ["Cloudflare Workers", "Static HTML", "ES Modules"],
    description: "Multilingual personal portfolio and service site with modular browser JavaScript, shared content JSON, static localized pages, and a Cloudflare Worker fallback runtime.",
    analyzedAt: now,
    gitCommitHash: commit
  },
  nodes: dedupNodes,
  edges: dedupEdges,
  layers,
  tour
};

fs.writeFileSync(path.join(ua, "intermediate", "assembled-graph.json"), JSON.stringify(graph, null, 2));
fs.writeFileSync(path.join(ua, "knowledge-graph.json"), JSON.stringify(graph, null, 2));
fs.writeFileSync(path.join(ua, "meta.json"), JSON.stringify({
  lastAnalyzedAt: now,
  gitCommitHash: commit,
  version: "1.0.0",
  analyzedFiles: scan.files.length
}, null, 2));
