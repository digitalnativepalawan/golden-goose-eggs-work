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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      destination_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: number
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: never
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: never
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      destinations: {
        Row: {
          barangay: string | null
          category: string
          color: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: number
          image: string | null
          images: Json | null
          lat: number
          lng: number
          name: string
          rating: string | null
          season: string | null
          sort_order: number | null
          temp: string | null
          tip: string | null
          travel: string | null
          updated_at: string | null
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          barangay?: string | null
          category: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: never
          image?: string | null
          images?: Json | null
          lat: number
          lng: number
          name: string
          rating?: string | null
          season?: string | null
          sort_order?: number | null
          temp?: string | null
          tip?: string | null
          travel?: string | null
          updated_at?: string | null
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          barangay?: string | null
          category?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: never
          image?: string | null
          images?: Json | null
          lat?: number
          lng?: number
          name?: string
          rating?: string | null
          season?: string | null
          sort_order?: number | null
          temp?: string | null
          tip?: string | null
          travel?: string | null
          updated_at?: string | null
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          id: string
          images: Json | null
          org: string | null
          price: string | null
          sort_order: number | null
          tags: string[] | null
          title: string
          video_type: string | null
          video_url: string | null
          when_text: string | null
          where_text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          images?: Json | null
          org?: string | null
          price?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title: string
          video_type?: string | null
          video_url?: string | null
          when_text?: string | null
          where_text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          images?: Json | null
          org?: string | null
          price?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          video_type?: string | null
          video_url?: string | null
          when_text?: string | null
          where_text?: string | null
        }
        Relationships: []
      }
      hunt_rewards: {
        Row: {
          badge: string | null
          created_at: string | null
          dest_id: string | null
          id: string
          images: Json | null
          points_required: number | null
          sort_order: number | null
          subtitle: string | null
          title: string
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          dest_id?: string | null
          id?: string
          images?: Json | null
          points_required?: number | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          dest_id?: string | null
          id?: string
          images?: Json | null
          points_required?: number | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      hunt_settings: {
        Row: {
          key: string
          value: Json | null
        }
        Insert: {
          key: string
          value?: Json | null
        }
        Update: {
          key?: string
          value?: Json | null
        }
        Relationships: []
      }
      my_sanvic_upcoming: {
        Row: {
          action: string | null
          action_id: string | null
          badge: string
          badge_style: string | null
          created_at: string | null
          cta: string | null
          id: string
          images: Json | null
          meta: string | null
          sort_order: number | null
          title: string
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          action?: string | null
          action_id?: string | null
          badge?: string
          badge_style?: string | null
          created_at?: string | null
          cta?: string | null
          id?: string
          images?: Json | null
          meta?: string | null
          sort_order?: number | null
          title?: string
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          action?: string | null
          action_id?: string | null
          badge?: string
          badge_style?: string | null
          created_at?: string | null
          cta?: string | null
          id?: string
          images?: Json | null
          meta?: string | null
          sort_order?: number | null
          title?: string
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      nearby_places: {
        Row: {
          barangay: string
          category: string
          created_at: string
          description: string
          distance_label: string
          icon: string
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          barangay: string
          category?: string
          created_at?: string
          description?: string
          distance_label?: string
          icon?: string
          id?: never
          name: string
          sort_order?: number
        }
        Update: {
          barangay?: string
          category?: string
          created_at?: string
          description?: string
          distance_label?: string
          icon?: string
          id?: never
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: number
          read: boolean | null
          related_post_id: number | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: never
          read?: boolean | null
          related_post_id?: number | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: never
          read?: boolean | null
          related_post_id?: number | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_categories: {
        Row: {
          created_at: string | null
          icon_svg: string | null
          id: number
          key: string
          label: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon_svg?: string | null
          id?: never
          key: string
          label: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon_svg?: string | null
          id?: never
          key?: string
          label?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      pulse_comments: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: number
          is_anonymous: boolean
          post_id: number
          text_content: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: never
          is_anonymous?: boolean
          post_id: number
          text_content: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: never
          is_anonymous?: boolean
          post_id?: number
          text_content?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pulse_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_likes: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: number
          post_id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: never
          post_id: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: never
          post_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pulse_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_posts: {
        Row: {
          admin_post: boolean | null
          category: string
          created_at: string | null
          display_name: string | null
          id: number
          image_url: string | null
          is_anonymous: boolean | null
          location_text: string | null
          tag: string | null
          text_content: string | null
          user_id: string | null
        }
        Insert: {
          admin_post?: boolean | null
          category?: string
          created_at?: string | null
          display_name?: string | null
          id?: never
          image_url?: string | null
          is_anonymous?: boolean | null
          location_text?: string | null
          tag?: string | null
          text_content?: string | null
          user_id?: string | null
        }
        Update: {
          admin_post?: boolean | null
          category?: string
          created_at?: string | null
          display_name?: string | null
          id?: never
          image_url?: string | null
          is_anonymous?: boolean | null
          location_text?: string | null
          tag?: string | null
          text_content?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          created_at: string | null
          destination_id: number | null
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          destination_id?: number | null
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string | null
          destination_id?: number | null
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_places_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      tala_responses: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          keywords: string[]
          response: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: never
          keywords: string[]
          response: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: never
          keywords?: string[]
          response?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tala_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      tala_suggestions: {
        Row: {
          active_from_day: number | null
          active_from_month: number | null
          active_to_day: number | null
          active_to_month: number | null
          created_at: string | null
          id: number
          sort_order: number | null
          text: string
          updated_at: string | null
        }
        Insert: {
          active_from_day?: number | null
          active_from_month?: number | null
          active_to_day?: number | null
          active_to_month?: number | null
          created_at?: string | null
          id?: never
          sort_order?: number | null
          text: string
          updated_at?: string | null
        }
        Update: {
          active_from_day?: number | null
          active_from_month?: number | null
          active_to_day?: number | null
          active_to_month?: number | null
          created_at?: string | null
          id?: never
          sort_order?: number | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      today_content: {
        Row: {
          data: Json
          key: string
          updated_at: string | null
        }
        Insert: {
          data?: Json
          key: string
          updated_at?: string | null
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      traveler_profiles: {
        Row: {
          avatar_url: string | null
          badges: string[] | null
          bio: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          favorite_categories: string[] | null
          id: string
          is_banned: boolean | null
          is_muted: boolean | null
          language: string | null
          last_seen: string | null
          moderation_note: string | null
          reputation: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_categories?: string[] | null
          id: string
          is_banned?: boolean | null
          is_muted?: boolean | null
          language?: string | null
          last_seen?: string | null
          moderation_note?: string | null
          reputation?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_categories?: string[] | null
          id?: string
          is_banned?: boolean | null
          is_muted?: boolean | null
          language?: string | null
          last_seen?: string | null
          moderation_note?: string | null
          reputation?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      tribes: {
        Row: {
          cap: number | null
          created_at: string | null
          extra: number | null
          id: string
          images: Json | null
          joined: number | null
          seats_open: number | null
          sort_order: number | null
          spots: number | null
          sub: string | null
          tags: string[] | null
          thumb_url: string | null
          title: string
          video_type: string | null
          video_url: string | null
          when_text: string | null
          where_text: string | null
        }
        Insert: {
          cap?: number | null
          created_at?: string | null
          extra?: number | null
          id?: string
          images?: Json | null
          joined?: number | null
          seats_open?: number | null
          sort_order?: number | null
          spots?: number | null
          sub?: string | null
          tags?: string[] | null
          thumb_url?: string | null
          title: string
          video_type?: string | null
          video_url?: string | null
          when_text?: string | null
          where_text?: string | null
        }
        Update: {
          cap?: number | null
          created_at?: string | null
          extra?: number | null
          id?: string
          images?: Json | null
          joined?: number | null
          seats_open?: number | null
          sort_order?: number | null
          spots?: number | null
          sub?: string | null
          tags?: string[] | null
          thumb_url?: string | null
          title?: string
          video_type?: string | null
          video_url?: string | null
          when_text?: string | null
          where_text?: string | null
        }
        Relationships: []
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
      user_settings: {
        Row: {
          email_notifications: boolean | null
          push_notifications: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          email_notifications?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          email_notifications?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_pulse_comment: {
        Args: { comment_id: number }
        Returns: undefined
      }
      admin_delete_pulse_post: { Args: { post_id: number }; Returns: undefined }
      admin_set_user_moderation: {
        Args: {
          banned: boolean
          muted: boolean
          note?: string
          target_user_id: string
        }
        Returns: undefined
      }
      admin_update_pulse_comment: {
        Args: { comment_id: number; new_text: string }
        Returns: undefined
      }
      admin_update_pulse_post: {
        Args: { new_category: string; new_text: string; post_id: number }
        Returns: undefined
      }
      get_public_profiles: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
