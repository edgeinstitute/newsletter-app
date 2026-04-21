import type { Block, InlineRun, NewsletterContent } from "./blocks";
import { runsToPlainText } from "./inline";

export type BeehiivBlock = Record<string, unknown>;

function runToFormatted(run: InlineRun): Record<string, unknown> {
  const entry: Record<string, unknown> = { text: run.text };
  const styling: string[] = [];
  if (run.marks?.includes("bold")) styling.push("bold");
  if (run.marks?.includes("italic")) styling.push("italic");
  if (styling.length) entry.styling = styling;
  if (run.href) entry.link = { href: run.href, target: "_blank" };
  return entry;
}

export function blockToBeehiivBlock(block: Block): BeehiivBlock {
  switch (block.type) {
    case "heading":
      return {
        type: "heading",
        level: String(block.level),
        text: block.text,
      };
    case "paragraph":
      return {
        type: "paragraph",
        plaintext: runsToPlainText(block.runs),
        formattedText: block.runs.map(runToFormatted),
      };
    case "image": {
      const payload: BeehiivBlock = {
        type: "image",
        imageUrl: block.url,
        alt_text: block.alt,
      };
      if (block.href) payload.url = block.href;
      if (block.width) payload.width = block.width;
      return payload;
    }
    case "button":
      return {
        type: "button",
        href: block.href,
        text: block.text,
        alignment: block.alignment ?? "left",
      };
    case "divider":
      return { type: "content_break" };
    case "list":
      return {
        type: "list",
        listType: block.ordered ? "ordered" : "unordered",
        items: block.items.filter((item) => item.trim().length > 0),
      };
    case "quote": {
      const payload: BeehiivBlock = { type: "quote", quote: block.text };
      if (block.author) payload.author = block.author;
      return payload;
    }
    case "html":
      return { type: "html", html: block.html };
  }
}

export function serializeContent(content: NewsletterContent): BeehiivBlock[] {
  return content.map(blockToBeehiivBlock);
}
