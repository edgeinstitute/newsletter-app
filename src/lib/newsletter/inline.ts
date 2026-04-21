import type { InlineMark, InlineRun } from "./blocks";

type Token =
  | { kind: "text"; value: string }
  | { kind: "open" | "close"; mark: InlineMark }
  | { kind: "link-open"; href: string }
  | { kind: "link-close" };

const BOLD = "**";
const ITALIC = "_";

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let buffer = "";
  let i = 0;
  let bold = false;
  let italic = false;

  const flush = () => {
    if (buffer) {
      tokens.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  while (i < input.length) {
    if (input.startsWith(BOLD, i)) {
      flush();
      tokens.push({ kind: bold ? "close" : "open", mark: "bold" });
      bold = !bold;
      i += BOLD.length;
      continue;
    }
    if (input[i] === ITALIC) {
      flush();
      tokens.push({ kind: italic ? "close" : "open", mark: "italic" });
      italic = !italic;
      i += 1;
      continue;
    }
    if (input[i] === "[") {
      const end = input.indexOf("]", i);
      if (end !== -1 && input[end + 1] === "(") {
        const hrefEnd = input.indexOf(")", end + 2);
        if (hrefEnd !== -1) {
          const label = input.slice(i + 1, end);
          const href = input.slice(end + 2, hrefEnd).trim();
          flush();
          tokens.push({ kind: "link-open", href });
          tokens.push({ kind: "text", value: label });
          tokens.push({ kind: "link-close" });
          i = hrefEnd + 1;
          continue;
        }
      }
    }
    buffer += input[i];
    i += 1;
  }
  flush();
  return tokens;
}

export function parseInline(input: string): InlineRun[] {
  if (!input) return [{ text: "" }];
  const tokens = tokenize(input);
  const runs: InlineRun[] = [];
  const marks = new Set<InlineMark>();
  let href: string | null = null;

  const push = (text: string) => {
    if (!text) return;
    const currentMarks = Array.from(marks);
    const run: InlineRun = { text };
    if (currentMarks.length) run.marks = currentMarks;
    if (href) run.href = href;
    runs.push(run);
  };

  for (const token of tokens) {
    if (token.kind === "text") push(token.value);
    else if (token.kind === "open") marks.add(token.mark);
    else if (token.kind === "close") marks.delete(token.mark);
    else if (token.kind === "link-open") href = token.href;
    else if (token.kind === "link-close") href = null;
  }

  return runs.length ? runs : [{ text: "" }];
}

export function serializeInline(runs: InlineRun[]): string {
  return runs
    .map((run) => {
      let text = run.text;
      const marks = run.marks ?? [];
      if (marks.includes("italic")) text = `_${text}_`;
      if (marks.includes("bold")) text = `**${text}**`;
      if (run.href) text = `[${text}](${run.href})`;
      return text;
    })
    .join("");
}

export function runsToPlainText(runs: InlineRun[]): string {
  return runs.map((r) => r.text).join("");
}
