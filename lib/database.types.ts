export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      workers: {
        Row: {
          id: string
          name: string
          email: string
          hourly_rate: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          hourly_rate: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          hourly_rate?: number
          active?: boolean
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          active?: boolean
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          worker_id: string
          worker_name: string
          project_id: string | null
          project_name: string | null
          date: string
          clock_in: string | null
          clock_out: string | null
          hours: number | null
          is_absent: boolean
          is_auto: boolean
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          worker_name: string
          project_id?: string | null
          project_name?: string | null
          date: string
          clock_in?: string | null
          clock_out?: string | null
          hours?: number | null
          is_absent?: boolean
          is_auto?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          worker_id?: string
          worker_name?: string
          project_id?: string | null
          project_name?: string | null
          date?: string
          clock_in?: string | null
          clock_out?: string | null
          hours?: number | null
          is_absent?: boolean
          is_auto?: boolean
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
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
