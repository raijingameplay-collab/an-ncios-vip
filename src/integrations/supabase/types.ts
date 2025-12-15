export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_action_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      advertiser_profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          instagram: string | null
          is_verified: boolean
          telegram: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          whatsapp: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          instagram?: string | null
          is_verified?: boolean
          telegram?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          whatsapp?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          instagram?: string | null
          is_verified?: boolean
          telegram?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          whatsapp?: string | null
        }
        Relationships: []
      }
      highlights: {
        Row: {
          content_type: string
          content_url: string | null
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          listing_id: string
          starts_at: string
        }
        Insert: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          listing_id: string
          starts_at?: string
        }
        Update: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          listing_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_main: boolean
          listing_id: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_main?: boolean
          listing_id: string
          photo_url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_main?: boolean
          listing_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tags: {
        Row: {
          listing_id: string
          tag_id: string
        }
        Insert: {
          listing_id: string
          tag_id: string
        }
        Update: {
          listing_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_tags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "service_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          advertiser_id: string
          age: number | null
          city: string
          contact_clicks: number
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_featured: boolean
          neighborhood: string | null
          price: number | null
          price_info: string | null
          priority_level: number
          published_at: string | null
          rejection_reason: string | null
          state: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          advertiser_id: string
          age?: number | null
          city: string
          contact_clicks?: number
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_featured?: boolean
          neighborhood?: string | null
          price?: number | null
          price_info?: string | null
          priority_level?: number
          published_at?: string | null
          rejection_reason?: string | null
          state: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          advertiser_id?: string
          age?: number | null
          city?: string
          contact_clicks?: number
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_featured?: boolean
          neighborhood?: string | null
          price?: number | null
          price_info?: string | null
          priority_level?: number
          published_at?: string | null
          rejection_reason?: string | null
          state?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          is_featured: boolean
          max_highlights: number
          max_photos: number
          name: string
          price: number
          priority_level: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_highlights?: number
          max_photos?: number
          name: string
          price: number
          priority_level?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_highlights?: number
          max_photos?: number
          name?: string
          price?: number
          priority_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          listing_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_email: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          listing_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tags: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          advertiser_id: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          plan_id: string
          starts_at: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          plan_id: string
          starts_at?: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          plan_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          advertiser_id: string
          created_at: string
          document_url: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          document_url: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          document_url?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertiser_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_advertiser_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_moderator: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "advertiser"
      listing_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "expired"
      report_reason: "misleading" | "fake" | "inappropriate" | "scam" | "other"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "advertiser"],
      listing_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "expired",
      ],
      report_reason: ["misleading", "fake", "inappropriate", "scam", "other"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
