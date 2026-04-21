export type ProfileRole = "admin" | "staff" | "viewer";

export type NewsletterStatus = "draft" | "syncing" | "synced" | "failed";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: ProfileRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: ProfileRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: ProfileRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          module_name: string;
          encrypted_config: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          module_name: string;
          encrypted_config: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          module_name?: string;
          encrypted_config?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      newsletters: {
        Row: {
          id: string;
          title: string;
          subtitle: string;
          preview_text: string;
          status: NewsletterStatus;
          content: Json;
          beehiiv_post_id: string | null;
          last_error: string | null;
          synced_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          subtitle?: string;
          preview_text?: string;
          status?: NewsletterStatus;
          content?: Json;
          beehiiv_post_id?: string | null;
          last_error?: string | null;
          synced_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string;
          preview_text?: string;
          status?: NewsletterStatus;
          content?: Json;
          beehiiv_post_id?: string | null;
          last_error?: string | null;
          synced_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      profile_role: ProfileRole;
      newsletter_status: NewsletterStatus;
    };
  };
}
