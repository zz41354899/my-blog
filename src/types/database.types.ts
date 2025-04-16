export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: number
          title: string
          slug: string
          content: string
          created_at: string
          updated_at: string
          user_id: string
          cover_url?: string | null
        }
        Insert: {
          id?: number
          title: string
          slug: string
          content: string
          created_at?: string
          updated_at?: string
          user_id: string
          cover_url?: string | null
        }
        Update: {
          id?: number
          title?: string
          slug?: string
          content?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          cover_url?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string | null
          avatar_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 