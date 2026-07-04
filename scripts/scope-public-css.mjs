import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const cssPath = path.resolve("dist/index.css");
const css = fs.readFileSync(cssPath, "utf8");
const root = postcss.parse(css, { from: cssPath });

const shadcnTokens = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "radius",
];

const tokenPattern = new RegExp(
  `(?<![\\w-])--(${shadcnTokens
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})(?![\\w-])`,
  "g",
);

function isInsideKeyframes(node) {
  let parent = node.parent;

  while (parent) {
    if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) {
      return true;
    }

    parent = parent.parent;
  }

  return false;
}

function splitSelectorList(selector) {
  const selectors = [];
  let current = "";
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (const char of selector) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (quote) {
      current += char;
      if (char === quote) quote = "";
      continue;
    }

    if (char === '"' || char === "'") {
      current += char;
      quote = char;
      continue;
    }

    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth -= 1;

    if (char === "," && depth === 0) {
      selectors.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) selectors.push(current.trim());
  return selectors;
}

function rootScopedSelector(selector) {
  if (!selector.startsWith(".")) return null;

  return `.tr-editor${selector}`;
}

function scopeSelector(selector) {
  if (!selector || selector.includes(".tr-editor")) return [selector];

  if (selector === ":root" || selector === ":host") {
    return [".tr-editor"];
  }

  if (selector.startsWith(".dark ")) {
    const rest = selector.slice(".dark ".length).trim();
    return [`.tr-editor.dark ${rest}`];
  }

  const scoped = [`.tr-editor ${selector}`];
  const rootScoped = rootScopedSelector(selector);

  if (rootScoped) scoped.unshift(rootScoped);
  return scoped;
}

root.walkAtRules((atRule) => {
  if (atRule.name === "font-face") {
    atRule.remove();
  }
});

root.walkRules((rule) => {
  if (isInsideKeyframes(rule)) return;

  rule.selector = splitSelectorList(rule.selector)
    .flatMap(scopeSelector)
    .join(",");
});

root.walkDecls((decl) => {
  decl.prop = decl.prop.replace(tokenPattern, "--tr-$1");
  decl.value = decl.value
    .replace(tokenPattern, "--tr-$1")
    .replace(/"Geist Variable", sans-serif/g, "var(--tr-font-sans)")
    .replace(/Geist Variable,sans-serif/g, "var(--tr-font-sans)");
});

let output = root.toString();

output = output.replace(
  /--tr-font-sans:var\(--tr-font-sans\)/g,
  "--tr-font-sans:inherit",
);

fs.writeFileSync(cssPath, output);

const unscopedSelectors = [];
root.walkRules((rule) => {
  if (isInsideKeyframes(rule)) return;

  for (const selector of splitSelectorList(rule.selector)) {
    if (!selector.includes(".tr-editor")) {
      unscopedSelectors.push(selector);
    }
  }
});

const checks = [
  ["global :root", /(^|[,{]\s*):root\b/],
  ["global .dark block", /(^|[,{]\s*)\.dark\s*\{/],
  ["Tailwind import", /@import\s+["']tailwindcss/],
  ["shadcn import", /@import\s+["']shadcn\//],
  ["fontsource import", /@import\s+["']@fontsource/],
  ["font-face", /@font-face/],
  ["global dark ancestor", /\.dark\s+\.tr-editor/],
  ["Tailwind global dark variant", /:is\(\.dark \*\)/],
  ["unprefixed --background declaration", /(?<![\w-])--background\s*:/],
  ["unprefixed --foreground declaration", /(?<![\w-])--foreground\s*:/],
  ["unprefixed --border declaration", /(?<![\w-])--border\s*:/],
  ["unprefixed --ring declaration", /(?<![\w-])--ring\s*:/],
  ["unprefixed --primary declaration", /(?<![\w-])--primary\s*:/],
];

const failedChecks = checks
  .filter(([, pattern]) => pattern.test(output))
  .map(([label]) => label);

if (unscopedSelectors.length > 0) {
  failedChecks.push(
    `unscoped selectors: ${unscopedSelectors.slice(0, 8).join(" | ")}`,
  );
}

if (failedChecks.length > 0) {
  throw new Error(
    `Public CSS isolation failed: ${failedChecks.join(", ")}`,
  );
}

console.log("Scoped public CSS written to dist/index.css");
