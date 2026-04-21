import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";
import {
  DEFAULT_INVITE_TEMPLATE,
  type InviteTemplate,
} from "@/lib/invite-template";
import type { Database } from "@/lib/supabase/database.types";

export type AdminDb = SupabaseClient<Database>;

export type PublicMailgunConfig = {
  domain: string;
  fromEmail: string;
  fromName: string;
  region: "us" | "eu";
  apiKeyMasked: string;
};

async function readSettings<T>(
  adminDb: AdminDb,
  moduleName: string,
): Promise<T | null> {
  const { data, error } = await adminDb
    .from("settings")
    .select("encrypted_config")
    .eq("module_name", moduleName)
    .maybeSingle();
  if (error || !data) return null;
  try {
    return JSON.parse(decrypt(data.encrypted_config)) as T;
  } catch {
    return null;
  }
}

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export async function getMailgunConfigPublic(
  adminDb: AdminDb,
): Promise<PublicMailgunConfig | null> {
  const cfg = await readSettings<{
    apiKey: string;
    domain: string;
    fromEmail: string;
    fromName: string;
    region: "us" | "eu";
  }>(adminDb, "mailgun");
  if (!cfg) return null;
  return {
    domain: cfg.domain,
    fromEmail: cfg.fromEmail,
    fromName: cfg.fromName,
    region: cfg.region,
    apiKeyMasked: maskKey(cfg.apiKey),
  };
}

export async function getInviteTemplateOrDefault(
  adminDb: AdminDb,
): Promise<InviteTemplate> {
  const tpl = await readSettings<InviteTemplate>(adminDb, "email_template_invite");
  return tpl ?? DEFAULT_INVITE_TEMPLATE;
}
