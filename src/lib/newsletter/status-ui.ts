import type { NewsletterStatus } from "@/lib/supabase/database.types";

export const newsletterStatusLabel: Record<NewsletterStatus, string> = {
  draft: "Draft",
  syncing: "Se trimite…",
  synced: "În beehiiv",
  failed: "Eroare",
};

export const newsletterStatusTone: Record<NewsletterStatus, string> = {
  draft: "bg-surface-muted text-text-secondary",
  syncing: "bg-primary-50 text-primary-700",
  synced: "bg-success-50 text-success-700",
  failed: "bg-danger-50 text-danger-700",
};
