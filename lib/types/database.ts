export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "STUDENT" | "ADMIN";
export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TabungType = "COLLECTION" | "DISTRIBUTION";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          student_id: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          student_id?: string | null;
          role?: UserRole;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          site_name: Json;
          tagline: Json;
          official_email: string | null;
          address_lines: Json;
          logo_path: string | null;
          donation_qr_path: string | null;
          donation_bank_name: string | null;
          donation_account_name: string | null;
          donation_account_number: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title_bm: string;
          title_en: string;
          body_bm: string;
          body_en: string;
          category: string;
          poster_path: string | null;
          status: PublishStatus;
          published_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["announcements"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
        Relationships: [];
      };
      tabung_records: {
        Row: {
          id: string;
          type: TabungType;
          amount_sen: number;
          description_bm: string;
          description_en: string;
          recipient: string | null;
          occurred_on: string;
          public_visible: boolean;
          source: string;
          submitted_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tabung_records"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["tabung_records"]["Insert"]>;
        Relationships: [];
      };
      organisation_units: {
        Row: { id: string; name_bm: string; name_en: string; display_order: number; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; name_bm: string; name_en: string; display_order?: number; is_active?: boolean };
        Update: Partial<Database["public"]["Tables"]["organisation_units"]["Insert"]>;
        Relationships: [];
      };
      organisation_officers: {
        Row: { id: string; full_name: string; email: string | null; photo_path: string | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; full_name: string; email?: string | null; photo_path?: string | null; is_active?: boolean };
        Update: Partial<Database["public"]["Tables"]["organisation_officers"]["Insert"]>;
        Relationships: [];
      };
      organisation_assignments: {
        Row: { id: string; officer_id: string; unit_id: string | null; position_bm: string; position_en: string; level: number; display_order: number; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; officer_id: string; unit_id?: string | null; position_bm: string; position_en: string; level?: number; display_order?: number; is_active?: boolean };
        Update: Partial<Database["public"]["Tables"]["organisation_assignments"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      publish_status: PublishStatus;
      tabung_type: TabungType;
    };
    CompositeTypes: Record<string, never>;
  };
}
