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
          status: 'active' | 'waiting_transcript' | 'completed'
          created_at: string
        }
        Insert: {
          month_year: string
          status: 'active' | 'waiting_transcript' | 'completed'
        }
        Update: {
          month_year: string
          status: 'active' | 'waiting_transcript' | 'completed'
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
          question_text?: string
          assigned_to?: string
          is_answered?: boolean
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
          confidence_score: number
          created_at: string
        }
        Insert: {
          answer_text: string
          confidence_score: number
        }
        Update: {
          question_id: string
          answer_text: string
          confidence_score: number
        }
      }
      client_companies: {
        Row: {
          id: string
          company_name: string
          company_type: CompanyType
        }
        Insert: {
          company_name: string
          company_type: CompanyType
        }
      }
      tags: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          name: string
        }
      }
      customer_conversations: {
        Row: {
          id: string
          customer_name: string
          innovera_person: string
          company_id: string
          date: string // YYYY-MM-DD
          tag_id: string[]
        }
        Insert: {
          customer_name: string
          innovera_person: string
          date: string // YYYY-MM-DD
          tag_id: string[]
        }
        Update: {
          customer_name?: string
          innovera_person?: string
          date?: string // YYYY-MM-DD
          tag_id?: string[]
        }
      },
      conversation_transcripts: {
        Row: {
          id: string;
          content: string;
          conversation_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
        };
      },
      conversation_notes: {
        Row: {
          id: string;
          content: string;
          conversation_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
        };
      },
      conversation_summaries: {
        Row: {
          id: string;
          content: string;
          conversation_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
        };
      },
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

export type CompanyType = 'vc' | 'corporate' | 'other';

export type Company = Database['public']['Tables']['client_companies']['Row']
export type CompanyInsert = Database['public']['Tables']['client_companies']['Insert']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']

export type CustomerConversation = Database['public']['Tables']['customer_conversations']['Row']
export type CustomerConversationInsert = Database['public']['Tables']['customer_conversations']['Insert']
export type CustomerConversationUpdate = Database['public']['Tables']['customer_conversations']['Update']

export type ConversationTranscript = Database['public']['Tables']['conversation_transcripts']['Row']
export type ConversationTranscriptInsert = Database['public']['Tables']['conversation_transcripts']['Insert']
export type ConversationTranscriptUpdate = Database['public']['Tables']['conversation_transcripts']['Update']

export type ConversationNote = Database['public']['Tables']['conversation_notes']['Row']
export type ConversationNoteInsert = Database['public']['Tables']['conversation_notes']['Insert']
export type ConversationNoteUpdate = Database['public']['Tables']['conversation_notes']['Update']

export type ConversationSummary = Database['public']['Tables']['conversation_summaries']['Row']
export type ConversationSummaryInsert = Database['public']['Tables']['conversation_summaries']['Insert']
export type ConversationSummaryUpdate = Database['public']['Tables']['conversation_summaries']['Update']