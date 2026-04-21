import { htmlToPlainText } from "@/lib/text/html-to-text";
import type { Block, InlineRun, NewsletterContent } from "./blocks";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}

function renderRun(run: InlineRun): string {
  let html = escapeHtml(run.text);
  if (run.marks?.includes("italic")) html = `<em>${html}</em>`;
  if (run.marks?.includes("bold")) html = `<strong>${html}</strong>`;
  if (run.href) {
    html = `<a href="${escapeAttr(run.href)}" style="color:#0a0a0a;text-decoration:underline;" target="_blank" rel="noopener">${html}</a>`;
  }
  return html;
}

function renderRuns(runs: InlineRun[]): string {
  return runs.map(renderRun).join("");
}

function alignToCss(align?: "left" | "center" | "right"): string {
  if (align === "center") return "center";
  if (align === "right") return "right";
  return "left";
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case "heading": {
      const sizes = { 1: "28px", 2: "22px", 3: "18px" } as const;
      const size = sizes[block.level];
      return `<h${block.level} style="margin:24px 0 8px 0;font-size:${size};font-weight:600;letter-spacing:-0.02em;color:#0a0a0a;line-height:1.3;">${escapeHtml(block.text)}</h${block.level}>`;
    }
    case "paragraph":
      return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#262626;">${renderRuns(block.runs)}</p>`;
    case "image": {
      const imgStyle = "max-width:100%;height:auto;display:block;border-radius:6px;";
      const widthAttr = block.width
        ? ` width="${block.width}%" style="${imgStyle}width:${block.width}%;"`
        : ` style="${imgStyle}"`;
      const img = `<img src="${escapeAttr(block.url)}" alt="${escapeAttr(block.alt)}"${widthAttr}/>`;
      const wrapped = block.href
        ? `<a href="${escapeAttr(block.href)}" target="_blank" rel="noopener">${img}</a>`
        : img;
      return `<div style="margin:20px 0;">${wrapped}</div>`;
    }
    case "button": {
      const align = alignToCss(block.alignment);
      return `<div style="margin:24px 0;text-align:${align};"><a href="${escapeAttr(block.href)}" target="_blank" rel="noopener" style="display:inline-block;background:#0a0a0a;color:#fafaf9;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;">${escapeHtml(block.text)}</a></div>`;
    }
    case "divider":
      return `<hr style="margin:32px 0;border:0;border-top:1px solid #e4e4e0;"/>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .filter((item) => item.trim().length > 0)
        .map((item) => `<li style="margin:4px 0;">${escapeHtml(item)}</li>`)
        .join("");
      return `<${tag} style="margin:16px 0;padding-left:24px;font-size:15px;line-height:1.65;color:#262626;">${items}</${tag}>`;
    }
    case "quote": {
      const author = block.author
        ? `<footer style="margin-top:8px;font-size:13px;color:#737373;">— ${escapeHtml(block.author)}</footer>`
        : "";
      return `<blockquote style="margin:24px 0;padding:12px 20px;border-left:3px solid #0a0a0a;background:#fafaf9;font-style:italic;color:#262626;font-size:15px;line-height:1.65;">${escapeHtml(block.text)}${author}</blockquote>`;
    }
    case "html":
      return block.html;
  }
}

export function renderBlocksToInnerHtml(content: NewsletterContent): string {
  return content.map(renderBlock).join("\n");
}

export function renderToHtml(
  content: NewsletterContent,
  meta: { title: string; subtitle?: string; previewText?: string },
): { html: string; text: string } {
  const preview = meta.previewText?.trim()
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(meta.previewText)}</div>`
    : "";
  const subtitle = meta.subtitle?.trim()
    ? `<p style="margin:0 0 24px 0;font-size:16px;color:#525252;line-height:1.5;">${escapeHtml(meta.subtitle)}</p>`
    : "";
  const title = meta.title?.trim()
    ? `<h1 style="margin:0 0 12px 0;font-size:32px;font-weight:600;letter-spacing:-0.02em;color:#0a0a0a;line-height:1.2;">${escapeHtml(meta.title)}</h1>`
    : "";

  const body = renderBlocksToInnerHtml(content);

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#fafaf9;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0a0a0a;">
    ${preview}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e0;border-radius:8px;overflow:hidden;max-width:640px;width:100%;">
            <tr>
              <td style="padding:40px 40px 32px 40px;">
                ${title}
                ${subtitle}
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 32px 40px;border-top:1px solid #efefec;color:#737373;font-size:12px;line-height:1.6;">
                Previzualizare trimisă prin Mailgun. Aspectul final depinde de trimiterea din beehiiv.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = htmlToPlainText(html);
  return { html, text };
}
