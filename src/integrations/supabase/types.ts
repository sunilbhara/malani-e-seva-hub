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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_generation_log: {
        Row: {
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string | null
          reporter_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          is_pinned: boolean
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_details: {
        Row: {
          admit_card_date: string | null
          age_max: number | null
          age_min: number | null
          apply_link: string | null
          apply_start: string | null
          departments: string[]
          exam_date: string | null
          extra_dates: Json
          fee_last_date: string | null
          fees: Json
          last_date: string | null
          notification_pdf: string | null
          official_website: string | null
          organisation: string
          post_id: string
          qualifications: string[]
          recruitment_id: string | null
          result_date: string | null
          salary: string | null
          state: string
          total_posts: number | null
          updated_at: string
        }
        Insert: {
          admit_card_date?: string | null
          age_max?: number | null
          age_min?: number | null
          apply_link?: string | null
          apply_start?: string | null
          departments?: string[]
          exam_date?: string | null
          extra_dates?: Json
          fee_last_date?: string | null
          fees?: Json
          last_date?: string | null
          notification_pdf?: string | null
          official_website?: string | null
          organisation: string
          post_id: string
          qualifications?: string[]
          recruitment_id?: string | null
          result_date?: string | null
          salary?: string | null
          state?: string
          total_posts?: number | null
          updated_at?: string
        }
        Update: {
          admit_card_date?: string | null
          age_max?: number | null
          age_min?: number | null
          apply_link?: string | null
          apply_start?: string | null
          departments?: string[]
          exam_date?: string | null
          extra_dates?: Json
          fee_last_date?: string | null
          fees?: Json
          last_date?: string | null
          notification_pdf?: string | null
          official_website?: string | null
          organisation?: string
          post_id?: string
          qualifications?: string[]
          recruitment_id?: string | null
          result_date?: string | null
          salary?: string | null
          state?: string
          total_posts?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_details_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_details_recruitment_id_fkey"
            columns: ["recruitment_id"]
            isOneToOne: false
            referencedRelation: "recruitments"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reminders: {
        Row: {
          created_at: string
          id: string
          post_id: string
          push_endpoint: string | null
          sent_1d_at: string | null
          sent_3d_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          push_endpoint?: string | null
          sent_1d_at?: string | null
          sent_3d_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          push_endpoint?: string | null
          sent_1d_at?: string | null
          sent_3d_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_reminders_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reminders_push_endpoint_fkey"
            columns: ["push_endpoint"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["endpoint"]
          },
        ]
      }
      newsletter_sends: {
        Row: {
          created_at: string
          sent_count: number
          week_start: string
        }
        Insert: {
          created_at?: string
          sent_count?: number
          week_start: string
        }
        Update: {
          created_at?: string
          sent_count?: number
          week_start?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          categories: string[]
          confirm_sent_at: string | null
          confirm_token: string
          confirmed_at: string | null
          consent_text: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          unsubscribe_token: string
          unsubscribed_at: string | null
        }
        Insert: {
          categories?: string[]
          confirm_sent_at?: string | null
          confirm_token?: string
          confirmed_at?: string | null
          consent_text?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Update: {
          categories?: string[]
          confirm_sent_at?: string | null
          confirm_token?: string
          confirmed_at?: string | null
          consent_text?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          channel: string
          created_at: string
          id: string
          post_id: string
          share_date: string | null
          visitor_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          post_id: string
          share_date?: string | null
          visitor_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          post_id?: string
          share_date?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string | null
          view_date: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id?: string | null
          view_date?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string | null
          view_date?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          bookmarks_count: number
          broadcast_at: string | null
          canonical_url: string | null
          category: string | null
          comments_count: number
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_verified: boolean
          language: string
          likes_count: number
          official_link: string | null
          og_image_url: string | null
          post_type: string | null
          published_at: string | null
          read_time_min: number | null
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          share_count: number
          slug: string
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          bookmarks_count?: number
          broadcast_at?: string | null
          canonical_url?: string | null
          category?: string | null
          comments_count?: number
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean
          language?: string
          likes_count?: number
          official_link?: string | null
          og_image_url?: string | null
          post_type?: string | null
          published_at?: string | null
          read_time_min?: number | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          share_count?: number
          slug: string
          source_url?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          bookmarks_count?: number
          broadcast_at?: string | null
          canonical_url?: string | null
          category?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean
          language?: string
          likes_count?: number
          official_link?: string | null
          og_image_url?: string | null
          post_type?: string | null
          published_at?: string | null
          read_time_min?: number | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          share_count?: number
          slug?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          failure_count: number
          p256dh: string
          topics: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          failure_count?: number
          p256dh: string
          topics?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          failure_count?: number
          p256dh?: string
          topics?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          quiz_date: string
          score: number
          total: number
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          quiz_date: string
          score: number
          total: number
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          quiz_date?: string
          score?: number
          total?: number
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          options: string[]
          position: number
          question: string
          quiz_date: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation?: string | null
          id?: string
          options: string[]
          position: number
          question: string
          quiz_date: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: string[]
          position?: number
          question?: string
          quiz_date?: string
        }
        Relationships: []
      }
      recruitment_follows: {
        Row: {
          applied: boolean
          applied_at: string | null
          created_at: string
          recruitment_id: string
          user_id: string
        }
        Insert: {
          applied?: boolean
          applied_at?: string | null
          created_at?: string
          recruitment_id: string
          user_id?: string
        }
        Update: {
          applied?: boolean
          applied_at?: string | null
          created_at?: string
          recruitment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_follows_recruitment_id_fkey"
            columns: ["recruitment_id"]
            isOneToOne: false
            referencedRelation: "recruitments"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitments: {
        Row: {
          created_at: string
          id: string
          name: string
          organisation: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organisation: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organisation?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          post_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          departments: string[]
          district: string | null
          qualification: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          departments?: string[]
          district?: string | null
          qualification?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          departments?: string[]
          district?: string | null
          qualification?: string | null
          updated_at?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_blog_analytics: { Args: never; Returns: Json }
      admin_quiz_questions: {
        Args: { p_quiz_date: string }
        Returns: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          options: string[]
          position: number
          question: string
          quiz_date: string
        }[]
        SetofOptions: {
          from: "*"
          to: "quiz_questions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      call_edge_function: {
        Args: { p_body?: Json; p_name: string }
        Returns: undefined
      }
      delete_push_subscription: {
        Args: { p_endpoint: string }
        Returns: undefined
      }
      due_reminders: {
        Args: never
        Returns: {
          last_date: string
          organisation: string
          post_id: string
          push_endpoint: string
          reminder_id: string
          slug: string
          stage: string
          title: string
          user_id: string
        }[]
      }
      generate_unique_post_slug: {
        Args: { _post_id: string; _title: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_allowed_push_endpoint: { Args: { p_endpoint: string }; Returns: boolean }
      list_posts: {
        Args: {
          p_category?: string
          p_department?: string
          p_exclude_id?: string
          p_ids?: string[]
          p_job_status?: string
          p_limit?: number
          p_offset?: number
          p_post_types?: string[]
          p_qualification?: string
          p_search?: string
          p_since?: string
          p_sort?: string
          p_state?: string
          p_tag?: string
        }
        Returns: {
          apply_start: string
          category: string
          comments_count: number
          days_left: number
          departments: string[]
          exam_date: string
          excerpt: string
          id: string
          image_url: string
          is_verified: boolean
          job_status: string
          last_date: string
          likes_count: number
          organisation: string
          post_type: string
          published_at: string
          qualifications: string[]
          read_time_min: number
          recruitment_id: string
          share_count: number
          slug: string
          state: string
          tags: string[]
          title: string
          total_count: number
          total_posts: number
          updated_at: string
          views_count: number
        }[]
      }
      mark_notifications_read: {
        Args: { p_ids?: string[] }
        Returns: undefined
      }
      moderate_comment: {
        Args: { p_comment_id: string; p_hidden?: boolean; p_pinned?: boolean }
        Returns: undefined
      }
      publish_due_posts: { Args: never; Returns: number }
      record_post_share: {
        Args: { p_channel?: string; p_post_id: string; p_visitor_id: string }
        Returns: undefined
      }
      record_post_view: {
        Args: { p_post_id: string; p_visitor_id: string }
        Returns: undefined
      }
      set_push_reminder: {
        Args: { p_enabled?: boolean; p_endpoint: string; p_post_id: string }
        Returns: undefined
      }
      slugify: { Args: { _input: string }; Returns: string }
      submit_quiz: {
        Args: {
          p_answers: number[]
          p_quiz_date: string
          p_visitor_id?: string
        }
        Returns: Json
      }
      upsert_push_subscription: {
        Args: {
          p_auth: string
          p_endpoint: string
          p_p256dh: string
          p_topics?: string[]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
