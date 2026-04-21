export type InlineMark = "bold" | "italic";
export type InlineRun = {
  text: string;
  marks?: InlineMark[];
  href?: string;
};

type Base = { id: string };

export type HeadingBlock = Base & {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
};

export type ParagraphBlock = Base & {
  type: "paragraph";
  runs: InlineRun[];
};

export type ImageBlock = Base & {
  type: "image";
  url: string;
  alt: string;
  href?: string;
  width?: number;
};

export type ButtonBlock = Base & {
  type: "button";
  text: string;
  href: string;
  alignment?: "left" | "center" | "right";
};

export type DividerBlock = Base & {
  type: "divider";
};

export type ListBlock = Base & {
  type: "list";
  ordered: boolean;
  items: string[];
};

export type QuoteBlock = Base & {
  type: "quote";
  text: string;
  author?: string;
};

export type HtmlBlock = Base & {
  type: "html";
  html: string;
};

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | ListBlock
  | QuoteBlock
  | HtmlBlock;

export type BlockType = Block["type"];

export type NewsletterContent = Block[];

export function newBlockId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `b_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function createBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: "" };
    case "paragraph":
      return { id, type, runs: [{ text: "" }] };
    case "image":
      return { id, type, url: "", alt: "" };
    case "button":
      return { id, type, text: "Click aici", href: "", alignment: "center" };
    case "divider":
      return { id, type };
    case "list":
      return { id, type, ordered: false, items: [""] };
    case "quote":
      return { id, type, text: "" };
    case "html":
      return { id, type, html: "" };
  }
}

export function isBlockArray(value: unknown): value is Block[] {
  if (!Array.isArray(value)) return false;
  return value.every((b) => {
    if (!b || typeof b !== "object") return false;
    const anyB = b as { id?: unknown; type?: unknown };
    return typeof anyB.id === "string" && typeof anyB.type === "string";
  });
}
