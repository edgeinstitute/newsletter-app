import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_INVITE_TEMPLATE, type InviteTemplate } from "@/lib/invite-template";
import { readModule } from "@/lib/server/settings-store";
import type { Database } from "@/lib/supabase/database.types";

export type AdminDb = SupabaseClient<Database>;

export type PublicMailgunConfig = {
  domain: string;
  fromEmail: string;
  fromName: string;
  region: "us" | "eu";
  apiKeyMasked: string;
};

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export async function getMailgunConfigPublic(
  adminDb: AdminDb,
): Promise<PublicMailgunConfig | null> {
  const cfg = await readModule<{
    apiKey: string;
    domain: string;
    fromEmail: string;
    fromName: string;
    region: "us" | "eu";
  }>("mailgun", adminDb);
  if (!cfg) return null;
  return {
    domain: cfg.domain,
    fromEmail: cfg.fromEmail,
    fromName: cfg.fromName,
    region: cfg.region,
    apiKeyMasked: maskKey(cfg.apiKey),
  };
}

export async function getInviteTemplateOrDefault(adminDb: AdminDb): Promise<InviteTemplate> {
  const tpl = await readModule<InviteTemplate>("email_template_invite", adminDb);
  return tpl ?? DEFAULT_INVITE_TEMPLATE;
}

export type PublicBeehiivConfig = {
  publicationId: string;
  apiKeyMasked: string;
};

export async function getBeehiivConfigPublic(
  adminDb: AdminDb,
): Promise<PublicBeehiivConfig | null> {
  const cfg = await readModule<{ apiKey: string; publicationId: string }>("beehiiv", adminDb);
  if (!cfg) return null;
  return {
    publicationId: cfg.publicationId,
    apiKeyMasked: maskKey(cfg.apiKey),
  };
}

export type PublicWordpressConfig = {
  siteUrl: string;
  username: string;
  passwordMasked: string;
};

export async function getWordpressConfigPublic(
  adminDb: AdminDb,
): Promise<PublicWordpressConfig | null> {
  const cfg = await readModule<{
    siteUrl: string;
    username: string;
    applicationPassword: string;
  }>("wordpress", adminDb);
  if (!cfg) return null;
  return {
    siteUrl: cfg.siteUrl,
    username: cfg.username,
    passwordMasked: maskKey(cfg.applicationPassword),
  };
}
