// Manually maintained types - regenerate with:
// npx supabase gen types typescript --project-id bmnvirrnbkrepmixiisq --schema public

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Currency = 'CNY' | 'USD'
export type ActiveStatus = 'active' | 'inactive'
export type Status = 'draft' | 'published' | 'archived'
export type Role = 'admin' | 'super_admin'
export type VerificationStatus = 'verified' | 'pending' | 'suspect' | 'failed'

export interface Database {
  public: {
    Tables: {
      providers: {
        Row: {
          id: string
          slug: string
          name: string
          name_en: string | null
          logo_url: string | null
          website_url: string | null
          description: string | null
          features: string[] | null
          is_recommended: boolean
          status: 'draft' | 'published' | 'archived'
          sort_order: number
          verified_at: string | null
          min_topup: string | null
          trial_credit: string | null
          transaction_fee: string | null
          invoice_support: boolean
          promo_code: string | null
          verification_status: 'verified' | 'pending' | 'suspect' | 'failed' | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          name_en?: string | null
          logo_url?: string | null
          website_url?: string | null
          description?: string | null
          features?: string[] | null
          is_recommended?: boolean
          status?: 'draft' | 'published' | 'archived'
          sort_order?: number
          verified_at?: string | null
          min_topup?: string | null
          trial_credit?: string | null
          transaction_fee?: string | null
          invoice_support?: boolean
          promo_code?: string | null
          verification_status?: 'verified' | 'pending' | 'suspect' | 'failed' | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          name_en?: string | null
          logo_url?: string | null
          website_url?: string | null
          description?: string | null
          features?: string[] | null
          is_recommended?: boolean
          status?: 'draft' | 'published' | 'archived'
          sort_order?: number
          verified_at?: string | null
          min_topup?: string | null
          trial_credit?: string | null
          transaction_fee?: string | null
          invoice_support?: boolean
          promo_code?: string | null
          verification_status?: 'verified' | 'pending' | 'suspect' | 'failed' | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          id: string
          slug: string
          name: string
          family: string
          provider_official: string | null
          description: string | null
          official_price_input: number | null
          official_price_output: number | null
          status: 'draft' | 'published' | 'archived'
          sort_order: number
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          family: string
          provider_official?: string | null
          description?: string | null
          official_price_input?: number | null
          official_price_output?: number | null
          status?: 'draft' | 'published' | 'archived'
          sort_order?: number
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          family?: string
          provider_official?: string | null
          description?: string | null
          official_price_input?: number | null
          official_price_output?: number | null
          status?: 'draft' | 'published' | 'archived'
          sort_order?: number
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          id: string
          provider_id: string
          name: string
          description: string | null
          is_primary: boolean
          priority: number
          status: 'active' | 'inactive'
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          name: string
          description?: string | null
          is_primary?: boolean
          priority?: number
          status?: 'active' | 'inactive'
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          name?: string
          description?: string | null
          is_primary?: boolean
          priority?: number
          status?: 'active' | 'inactive'
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'channels_provider_id_fkey'
            columns: ['provider_id']
            referencedRelation: 'providers'
            referencedColumns: ['id']
          }
        ]
      }
      prices: {
        Row: {
          id: string
          channel_id: string
          model_id: string
          price_input: number
          price_output: number
          rate: number | null
          currency: 'CNY' | 'USD'
          effective_date: string
          notes: string | null
          verified_at: string | null
          status: 'active' | 'inactive'
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          model_id: string
          price_input: number
          price_output: number
          rate?: number | null
          currency?: 'CNY' | 'USD'
          effective_date: string
          notes?: string | null
          verified_at?: string | null
          status?: 'active' | 'inactive'
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          model_id?: string
          price_input?: number
          price_output?: number
          rate?: number | null
          currency?: 'CNY' | 'USD'
          effective_date?: string
          notes?: string | null
          verified_at?: string | null
          status?: 'active' | 'inactive'
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'prices_channel_id_fkey'
            columns: ['channel_id']
            referencedRelation: 'channels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prices_model_id_fkey'
            columns: ['model_id']
            referencedRelation: 'models'
            referencedColumns: ['id']
          }
        ]
      }
      articles: {
        Row: {
          id: string
          slug: string
          title: string
          summary: string | null
          content: string
          cover_image_url: string | null
          related_provider_id: string | null
          category: 'tutorial' | 'guide' | 'news' | 'faq'
          tags: string[] | null
          status: 'draft' | 'published' | 'archived'
          view_count: number
          sort_order: number
          published_at: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          summary?: string | null
          content: string
          cover_image_url?: string | null
          related_provider_id?: string | null
          category: 'tutorial' | 'guide' | 'news' | 'faq'
          tags?: string[] | null
          status?: 'draft' | 'published' | 'archived'
          view_count?: number
          sort_order?: number
          published_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          summary?: string | null
          content?: string
          cover_image_url?: string | null
          related_provider_id?: string | null
          category?: 'tutorial' | 'guide' | 'news' | 'faq'
          tags?: string[] | null
          status?: 'draft' | 'published' | 'archived'
          view_count?: number
          sort_order?: number
          published_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'articles_related_provider_id_fkey'
            columns: ['related_provider_id']
            referencedRelation: 'providers'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: 'admin' | 'super_admin'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'super_admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'super_admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      click_events: {
        Row: {
          id: string
          provider_id: string
          referrer: string | null
          user_agent: string | null
          ip_address: string | null
          clicked_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          referrer?: string | null
          user_agent?: string | null
          ip_address?: string | null
          clicked_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          referrer?: string | null
          user_agent?: string | null
          ip_address?: string | null
          clicked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'click_events_provider_id_fkey'
            columns: ['provider_id']
            referencedRelation: 'providers'
            referencedColumns: ['id']
          }
        ]
      }
      price_history: {
        Row: {
          id: string
          price_id: string
          channel_id: string
          model_id: string
          price_input_old: number | null
          price_output_old: number | null
          rate_old: number | null
          price_input_new: number
          price_output_new: number
          rate_new: number | null
          currency: 'CNY' | 'USD'
          change_type: 'created' | 'updated' | 'deleted'
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          price_id: string
          channel_id: string
          model_id: string
          price_input_old?: number | null
          price_output_old?: number | null
          rate_old?: number | null
          price_input_new: number
          price_output_new: number
          rate_new?: number | null
          currency: 'CNY' | 'USD'
          change_type: 'created' | 'updated' | 'deleted'
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          price_id?: string
          channel_id?: string
          model_id?: string
          price_input_old?: number | null
          price_output_old?: number | null
          rate_old?: number | null
          price_input_new?: number
          price_output_new?: number
          rate_new?: number | null
          currency?: 'CNY' | 'USD'
          change_type?: 'created' | 'updated' | 'deleted'
          changed_by?: string | null
          changed_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
