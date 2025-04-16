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
          cover_url?: string
        }
        Insert: {
          id?: number
          title: string
          slug: string
          content: string
          created_at?: string
          updated_at?: string
          user_id: string
          cover_url?: string
        }
        Update: {
          id?: number
          title?: string
          slug?: string
          content?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          cover_url?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name?: string
          avatar_url?: string
          website?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          avatar_url?: string
          website?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string
          website?: string
          created_at?: string
          updated_at?: string
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