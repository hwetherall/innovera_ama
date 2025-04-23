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
      sessions: {
        Row: {
          id: string
          month_year: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          month_year: string
          is_active: boolean
        }
        Update: {
          month_year: string
          is_active: boolean
        }
      }
      questions: {
        Row: {
          id: string
          session_id: string
          question_text: string
          assigned_to: string
          is_answered: boolean
          created_at: string
        }
        Insert: {
          question_text: string
          assigned_to: string
        }
        Update: {
          question_text: string
          assigned_to: string
          is_answered: boolean
        }
      }
      transcripts: {
        Row: {
          id: string
          session_id: string
          content: string
          uploaded_at: string
        }
        Insert: {
          session_id?: string
          content: string
        }
        Update: {
          session_id: string
          content: string
        }
      }
      answers: {
        Row: {
          id: string
          question_id: string
          answer_text: string
          source_sessions: string
          confidence_score: number
          created_at: string
        }
        Insert: {
          answer_text: string
          confidence_score?: number
        }
        Update: {
          question_id: string
          answer_text: string
          confidence_score: number
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

// Export convenience types from the Database interface
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']

export type Question = Database['public']['Tables']['questions']['Row']
export type QuestionInsert = Database['public']['Tables']['questions']['Insert']
export type QuestionUpdate = Database['public']['Tables']['questions']['Update']

export type Transcript = Database['public']['Tables']['transcripts']['Row']
export type TranscriptInsert = Database['public']['Tables']['transcripts']['Insert']
export type TranscriptUpdate = Database['public']['Tables']['transcripts']['Update']

export type Answer = Database['public']['Tables']['answers']['Row']
export type AnswerInsert = Database['public']['Tables']['answers']['Insert']
export type AnswerUpdate = Database['public']['Tables']['answers']['Update'] 