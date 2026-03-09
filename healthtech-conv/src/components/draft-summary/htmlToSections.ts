/**
 * htmlToSections.ts
 *
 * Converts TipTap editor HTML back into structured sections with markdown content.
 *
 * TipTap (with StarterKit) outputs semantic HTML — it does NOT preserve custom
 * wrappers like <section class="doc-section">. The actual output looks like:
 *
 *   <h3>Assessment</h3>
 *   <p>Patient presents with <strong>acute</strong> pain.</p>
 *   <ol>
 *     <li><p>Rest</p><ul><li><p>Elevate leg</p></li></ul></li>
 *   </ol>
 *   <h3>Plan</h3>
 *   <p>...</p>
 *
 * Strategy:
 *   1. Walk top-level nodes of the editor HTML
 *   2. Split on <h1>/<h2>/<h3> tags — each becomes a new section title
 *   3. Everything between headings becomes that section's markdown content
 *
 * Inline formatting supported (round-trips correctly):
 *   <strong> / <b>  →  **bold**
 *   <em> / <i>      →  *italic*
 *   <u>             →  __underline__   (TipTap Underline extension)
 *   <code>          →  `code`
 *   <s> / <del>     →  ~~strikethrough~~
 *   <a href="...">  →  [text](url)
 *
 * Block elements supported:
 *   <p>             →  paragraph line
 *   <ol>            →  1. numbered item
 *   <ul>            →  - bullet item
 *   <li>            →  handles TipTap's <li><p>text</p><ul>nested</ul></li> pattern
 *   <blockquote>    →  > quote
 *   <pre><code>     →  ``` code block ```
 *   <hr>            →  ---
 */

export interface Section {
  id?: string;
  title: string;
  content: string;
  position: number;
}

// ---------------------------------------------------------------------------
// Inline → Markdown
// ---------------------------------------------------------------------------

/**
 * Recursively convert inline nodes to markdown.
 * Handles text nodes and all inline formatting elements TipTap produces.
 */
function inlineToMarkdown(node: Node): string {
  // Text node — return as-is (TipTap does not HTML-encode these the same way
  // the old escapeHtml helper did, so no unescaping needed here)
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const inner = childrenToMarkdown(el);

  switch (tag) {
    case "strong":
    case "b":
      return `**${inner}**`;

    case "em":
    case "i":
      return `*${inner}*`;

    case "u":
      return `__${inner}__`;

    case "code":
      return `\`${inner}\``;

    case "s":
    case "strike":
    case "del":
      return `~~${inner}~~`;

    case "a": {
      const href = el.getAttribute("href") ?? "";
      return `[${inner}](${href})`;
    }

    case "br":
      return "\n";

    default:
      return inner;
  }
}

function childrenToMarkdown(el: Element): string {
  return Array.from(el.childNodes).map(inlineToMarkdown).join("");
}

function blockToLines(el: Element, listDepth = 0): string[] {
  const tag = el.tagName.toLowerCase();

  if (tag === "p") {
    const text = childrenToMarkdown(el).trim();
    return text ? [text] : [];
  }

  if (tag === "ol") {
    const lines: string[] = [];
    let counter = 1;
    for (const child of Array.from(el.children)) {
      if (child.tagName.toLowerCase() !== "li") continue;
      lines.push(...liToLines(child, counter, "ol", listDepth));
      counter++;
    }
    return lines;
  }
  if (tag === "ul") {
    const lines: string[] = [];
    for (const child of Array.from(el.children)) {
      if (child.tagName.toLowerCase() !== "li") continue;
      lines.push(...liToLines(child, 0, "ul", listDepth));
    }
    return lines;
  }

  if (tag === "blockquote") {
    const inner: string[] = [];
    for (const child of Array.from(el.children)) {
      inner.push(...blockToLines(child, listDepth));
    }
    return inner.map((line) => `> ${line}`);
  }

  if (tag === "pre") {
    const codeEl = el.querySelector("code");
    const code = codeEl ? (codeEl.textContent ?? "") : (el.textContent ?? "");
    return ["```", ...code.split("\n"), "```"];
  }

  if (tag === "hr") {
    return ["---"];
  }

  if (/^h[1-6]$/.test(tag)) {
    const text = childrenToMarkdown(el).trim();
    return text ? [text] : [];
  }

  const text = childrenToMarkdown(el).trim();
  return text ? [text] : [];
}

function liToLines(
  li: Element,
  index: number,
  listType: "ol" | "ul",
  depth: number,
): string[] {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);
  const prefix = listType === "ol" ? `${indent}${index}. ` : `${indent}- `;

  const inlineParts: string[] = [];
  const nestedLists: Element[] = [];

  for (const child of Array.from(li.childNodes)) {
    const childTag =
      child.nodeType === Node.ELEMENT_NODE
        ? (child as Element).tagName.toLowerCase()
        : null;

    if (childTag === "ol" || childTag === "ul") {
      nestedLists.push(child as Element);
    } else if (childTag === "p") {
      inlineParts.push(childrenToMarkdown(child as Element));
    } else {
      inlineParts.push(inlineToMarkdown(child));
    }
  }

  const text = inlineParts.join("").trim();
  if (text) lines.push(`${prefix}${text}`);

  for (const nestedList of nestedLists) {
    const nestedTag = nestedList.tagName.toLowerCase() as "ol" | "ul";
    let nestedCounter = 1;
    for (const child of Array.from(nestedList.children)) {
      if (child.tagName.toLowerCase() !== "li") continue;
      lines.push(...liToLines(child, nestedCounter, nestedTag, depth + 1));
      nestedCounter++;
    }
  }

  return lines;
}

function splitIntoSections(body: Element): Section[] {
  const sections: Section[] = [];
  let currentTitle = "";
  let currentId: string | undefined = undefined;
  let currentLines: string[] = [];
  let position = 0;
  const flush = () => {
    const raw = currentLines.join("\n").trim();

    const content = raw.replace(/\n{3,}/g, "\n\n");

    const section: Section = { title: currentTitle, content, position };
    if (currentId) section.id = currentId;
    if (position) section.position = position;
    sections.push(section);

    position = 0;
    currentTitle = "";
    currentId = undefined;
    currentLines = [];
  };

  for (const node of Array.from(body.children)) {
    const tag = node.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      if (currentTitle || currentLines.length > 0) {
        flush();
      }
      currentTitle = childrenToMarkdown(node).trim();
      position = (node as Element).getAttribute("data-section-position")
        ? Number((node as Element).getAttribute("data-section-position"))
        : 0;
      currentId =
        (node as Element).getAttribute("data-section-id") ?? undefined;
    } else {
      const lines = blockToLines(node);
      if (lines.length) {
        // Separate block elements with a blank line
        if (currentLines.length > 0) currentLines.push("");
        currentLines.push(...lines);
      }
    }
  }

  if (currentTitle || currentLines.length > 0) {
    flush();
  }

  return sections;
}

export function htmlToSections(html: string): Section[] {
  if (!html?.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  return splitIntoSections(doc.body);
}

export function validateRoundTrip(
  original: Section[],
  reparsed: Section[],
): void {
  if (original.length !== reparsed.length) {
    console.warn(
      `[htmlToSections] Section count: ${original.length} → ${reparsed.length}`,
    );
  }

  original.forEach((orig, i) => {
    const rep = reparsed[i];
    if (!rep) {
      console.warn(`[htmlToSections] Missing section at index ${i}`);
      return;
    }
    if (orig.title !== rep.title) {
      console.warn(
        `[htmlToSections] Title drift [${i}]: "${orig.title}" → "${rep.title}"`,
      );
    }
    if (orig.content !== rep.content) {
      console.warn(
        `[htmlToSections] Content drift [${i}] ("${orig.title}"):`,
        "\noriginal:",
        JSON.stringify(orig.content),
        "\nreparsed:",
        JSON.stringify(rep.content),
      );
    }
  });
}
