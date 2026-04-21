"use client";

import { useMemo } from "react";
import { renderToHtml } from "@/lib/newsletter/render-html";
import type { NewsletterContent } from "@/lib/newsletter/blocks";

type Props = {
  title: string;
  subtitle: string;
  previewText: string;
  content: NewsletterContent;
};

export function PreviewPane({ title, subtitle, previewText, content }: Props) {
  const html = useMemo(() => {
    const { html } = renderToHtml(content, {
      title,
      subtitle: subtitle || undefined,
      previewText: previewText || undefined,
    });
    return html;
  }, [title, subtitle, previewText, content]);

  return (
    <div className="border-border bg-surface-elevated flex flex-col overflow-hidden rounded-xs border">
      <div className="border-border border-b px-4 py-3">
        <p className="text-text-secondary text-xs font-medium tracking-wide uppercase">
          Previzualizare
        </p>
      </div>
      <iframe
        title="Previzualizare newsletter"
        srcDoc={html}
        sandbox=""
        className="h-[70vh] w-full border-0 bg-white"
      />
    </div>
  );
}
