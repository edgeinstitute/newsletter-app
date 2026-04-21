"use client";

import { useState } from "react";
import { SettingsIcon, MailIcon, UsersIcon } from "@/components/icons";
import type { PublicMailgunConfig } from "@/lib/queries/settings";
import type { InviteTemplate } from "@/lib/invite-template";
import { MailgunConfigForm } from "./MailgunConfigForm";
import { InviteTemplateEditor } from "./InviteTemplateEditor";
import { SendInviteForm } from "./SendInviteForm";

type Tab = "mailgun" | "template" | "invite";

type Props = {
  mailgun: PublicMailgunConfig | null;
  template: InviteTemplate;
};

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "mailgun", label: "Mailgun", icon: SettingsIcon },
  { key: "template", label: "Template email", icon: MailIcon },
  { key: "invite", label: "Trimite invitație", icon: UsersIcon },
];

export function SettingsView({ mailgun, template }: Props) {
  const [tab, setTab] = useState<Tab>("mailgun");
  const mailgunReady = Boolean(mailgun);

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-1 rounded-xs border border-border bg-surface-elevated p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-xs px-3 py-2 text-sm transition ${
                active
                  ? "bg-primary text-text-inverse"
                  : "text-text-secondary hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "mailgun" && <MailgunConfigForm initial={mailgun} />}
      {tab === "template" && <InviteTemplateEditor initial={template} />}
      {tab === "invite" && <SendInviteForm mailgunReady={mailgunReady} />}
    </div>
  );
}
