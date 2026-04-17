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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          founder_id: string
          id: string
          idea_id: string
          investor_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          founder_id: string
          id?: string
          idea_id: string
          investor_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          founder_id?: string
          id?: string
          idea_id?: string
          investor_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_violations: {
        Row: {
          blocked_content: string
          created_at: string
          detected_patterns: string[]
          id: string
          receiver_id: string | null
          severity: string
          user_id: string
        }
        Insert: {
          blocked_content: string
          created_at?: string
          detected_patterns: string[]
          id?: string
          receiver_id?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          blocked_content?: string
          created_at?: string
          detected_patterns?: string[]
          id?: string
          receiver_id?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      companies_dataset: {
        Row: {
          company_name: string
          company_type: string | null
          country: string | null
          created_at: string
          description: string | null
          founded_year: number | null
          funding_round: string | null
          id: string
          location: string | null
          market_share_pct: number | null
          problem: string | null
          risk_score: number | null
          sector: string | null
          solution: string | null
          source: string | null
          status: string | null
          success_probability: number | null
          target_audience: string | null
          team_size: number | null
          total_funding_usd: number | null
          website: string | null
        }
        Insert: {
          company_name: string
          company_type?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          funding_round?: string | null
          id?: string
          location?: string | null
          market_share_pct?: number | null
          problem?: string | null
          risk_score?: number | null
          sector?: string | null
          solution?: string | null
          source?: string | null
          status?: string | null
          success_probability?: number | null
          target_audience?: string | null
          team_size?: number | null
          total_funding_usd?: number | null
          website?: string | null
        }
        Update: {
          company_name?: string
          company_type?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          funding_round?: string | null
          id?: string
          location?: string | null
          market_share_pct?: number | null
          problem?: string | null
          risk_score?: number | null
          sector?: string | null
          solution?: string | null
          source?: string | null
          status?: string | null
          success_probability?: number | null
          target_audience?: string | null
          team_size?: number | null
          total_funding_usd?: number | null
          website?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          contract_terms: string
          contract_url: string | null
          created_at: string
          equity_percentage: number | null
          founder_id: string
          founder_signed_at: string | null
          id: string
          idea_id: string
          investment_amount_usd: number
          investor_id: string
          investor_signed_at: string | null
          notes: string | null
          payment_reference: string | null
          payment_status: string
          platform_fee_amount: number | null
          platform_fee_percentage: number
          status: Database["public"]["Enums"]["deal_status"]
          updated_at: string
          valuation_usd: number | null
        }
        Insert: {
          contract_terms: string
          contract_url?: string | null
          created_at?: string
          equity_percentage?: number | null
          founder_id: string
          founder_signed_at?: string | null
          id?: string
          idea_id: string
          investment_amount_usd: number
          investor_id: string
          investor_signed_at?: string | null
          notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          platform_fee_amount?: number | null
          platform_fee_percentage?: number
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
          valuation_usd?: number | null
        }
        Update: {
          contract_terms?: string
          contract_url?: string | null
          created_at?: string
          equity_percentage?: number | null
          founder_id?: string
          founder_signed_at?: string | null
          id?: string
          idea_id?: string
          investment_amount_usd?: number
          investor_id?: string
          investor_signed_at?: string | null
          notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          platform_fee_amount?: number | null
          platform_fee_percentage?: number
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
          valuation_usd?: number | null
        }
        Relationships: []
      }
      ideas: {
        Row: {
          additional_info: string | null
          ai_evaluation: string | null
          ai_recommendations: string | null
          ai_score: number | null
          capital_required: string
          capital_required_usd: number | null
          competitive_advantage: string
          competitors: string
          created_at: string
          decision: string | null
          description: string
          document_url: string | null
          evaluation_version: number
          execution_score: number | null
          expected_revenue: string
          expected_revenue_usd: number | null
          founder_id: string
          id: string
          innovation_score: number | null
          investment_score: number | null
          location: string
          market_score: number | null
          risk_score: number | null
          score_history: Json | null
          sector: string
          status: string
          target_audience: string
          team_experience: string
          team_size: string
          timeline: string
          title: string
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          ai_evaluation?: string | null
          ai_recommendations?: string | null
          ai_score?: number | null
          capital_required?: string
          capital_required_usd?: number | null
          competitive_advantage?: string
          competitors?: string
          created_at?: string
          decision?: string | null
          description: string
          document_url?: string | null
          evaluation_version?: number
          execution_score?: number | null
          expected_revenue?: string
          expected_revenue_usd?: number | null
          founder_id: string
          id?: string
          innovation_score?: number | null
          investment_score?: number | null
          location?: string
          market_score?: number | null
          risk_score?: number | null
          score_history?: Json | null
          sector: string
          status?: string
          target_audience?: string
          team_experience?: string
          team_size?: string
          timeline?: string
          title: string
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          ai_evaluation?: string | null
          ai_recommendations?: string | null
          ai_score?: number | null
          capital_required?: string
          capital_required_usd?: number | null
          competitive_advantage?: string
          competitors?: string
          created_at?: string
          decision?: string | null
          description?: string
          document_url?: string | null
          evaluation_version?: number
          execution_score?: number | null
          expected_revenue?: string
          expected_revenue_usd?: number | null
          founder_id?: string
          id?: string
          innovation_score?: number | null
          investment_score?: number | null
          location?: string
          market_score?: number | null
          risk_score?: number | null
          score_history?: Json | null
          sector?: string
          status?: string
          target_audience?: string
          team_experience?: string
          team_size?: string
          timeline?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_founder_profile_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          full_legal_name: string | null
          id: string
          id_document_url: string | null
          national_id: string | null
          nationality: string | null
          phone_number: string | null
          proof_of_address_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_legal_name?: string | null
          id?: string
          id_document_url?: string | null
          national_id?: string | null
          nationality?: string | null
          phone_number?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_legal_name?: string | null
          id?: string
          id_document_url?: string | null
          national_id?: string | null
          nationality?: string | null
          phone_number?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          idea_id: string | null
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          idea_id?: string | null
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          idea_id?: string | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      nda_agreements: {
        Row: {
          created_at: string
          founder_id: string
          founder_signature: string | null
          founder_signed_at: string | null
          id: string
          idea_id: string
          investor_id: string
          investor_signature: string | null
          investor_signed_at: string | null
          nda_content: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          founder_id: string
          founder_signature?: string | null
          founder_signed_at?: string | null
          id?: string
          idea_id: string
          investor_id: string
          investor_signature?: string | null
          investor_signed_at?: string | null
          nda_content: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          founder_id?: string
          founder_signature?: string | null
          founder_signed_at?: string | null
          id?: string
          idea_id?: string
          investor_id?: string
          investor_signature?: string | null
          investor_signed_at?: string | null
          nda_content?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount_usd: number | null
          created_at: string
          currency: string | null
          deal_id: string | null
          event_type: string
          external_reference: string | null
          id: string
          provider: string
          raw_payload: Json | null
          status: string
        }
        Insert: {
          amount_usd?: number | null
          created_at?: string
          currency?: string | null
          deal_id?: string | null
          event_type: string
          external_reference?: string | null
          id?: string
          provider?: string
          raw_payload?: Json | null
          status: string
        }
        Update: {
          amount_usd?: number | null
          created_at?: string
          currency?: string | null
          deal_id?: string | null
          event_type?: string
          external_reference?: string | null
          id?: string
          provider?: string
          raw_payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_ideas: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_ideas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "entrepreneur" | "investor" | "explorer"
      deal_status:
        | "draft"
        | "pending_founder"
        | "pending_investor"
        | "negotiating"
        | "signed"
        | "completed"
        | "cancelled"
      kyc_status: "not_started" | "pending" | "approved" | "rejected"
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
      app_role: ["entrepreneur", "investor", "explorer"],
      deal_status: [
        "draft",
        "pending_founder",
        "pending_investor",
        "negotiating",
        "signed",
        "completed",
        "cancelled",
      ],
      kyc_status: ["not_started", "pending", "approved", "rejected"],
    },
  },
} as const
