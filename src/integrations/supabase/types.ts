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
          deal_type: string
          equity_percentage: number | null
          escrow_hold_id: string | null
          escrow_status: string | null
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
          deal_type?: string
          equity_percentage?: number | null
          escrow_hold_id?: string | null
          escrow_status?: string | null
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
          deal_type?: string
          equity_percentage?: number | null
          escrow_hold_id?: string | null
          escrow_status?: string | null
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
      idea_financials: {
        Row: {
          created_at: string
          expected_costs_usd: number
          expected_profit_usd: number | null
          expected_revenue_usd: number
          id: string
          idea_id: string
          notes: string | null
          year_number: number
        }
        Insert: {
          created_at?: string
          expected_costs_usd?: number
          expected_profit_usd?: number | null
          expected_revenue_usd?: number
          id?: string
          idea_id: string
          notes?: string | null
          year_number: number
        }
        Update: {
          created_at?: string
          expected_costs_usd?: number
          expected_profit_usd?: number | null
          expected_revenue_usd?: number
          id?: string
          idea_id?: string
          notes?: string | null
          year_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "idea_financials_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_views: {
        Row: {
          id: string
          idea_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          idea_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          idea_id?: string
          viewed_at?: string
          viewer_id?: string | null
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
          expected_5yr_revenue_usd: number | null
          expected_revenue: string
          expected_revenue_usd: number | null
          founder_id: string
          id: string
          innovation_score: number | null
          investment_score: number | null
          listing_type: Database["public"]["Enums"]["idea_listing_type"]
          location: string
          market_score: number | null
          milestones: Json | null
          problem_solved: string | null
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
          view_count: number
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
          expected_5yr_revenue_usd?: number | null
          expected_revenue?: string
          expected_revenue_usd?: number | null
          founder_id: string
          id?: string
          innovation_score?: number | null
          investment_score?: number | null
          listing_type?: Database["public"]["Enums"]["idea_listing_type"]
          location?: string
          market_score?: number | null
          milestones?: Json | null
          problem_solved?: string | null
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
          view_count?: number
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
          expected_5yr_revenue_usd?: number | null
          expected_revenue?: string
          expected_revenue_usd?: number | null
          founder_id?: string
          id?: string
          innovation_score?: number | null
          investment_score?: number | null
          listing_type?: Database["public"]["Enums"]["idea_listing_type"]
          location?: string
          market_score?: number | null
          milestones?: Json | null
          problem_solved?: string | null
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
          view_count?: number
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
          ai_verification_result: Json | null
          ai_verified_at: string | null
          created_at: string
          date_of_birth: string | null
          face_match_score: number | null
          full_legal_name: string | null
          id: string
          id_card_back_url: string | null
          id_card_front_url: string | null
          id_document_url: string | null
          mindee_extracted_data: Json | null
          mindee_verified_at: string | null
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
          ai_verification_result?: Json | null
          ai_verified_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          face_match_score?: number | null
          full_legal_name?: string | null
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          id_document_url?: string | null
          mindee_extracted_data?: Json | null
          mindee_verified_at?: string | null
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
          ai_verification_result?: Json | null
          ai_verified_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          face_match_score?: number | null
          full_legal_name?: string | null
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          id_document_url?: string | null
          mindee_extracted_data?: Json | null
          mindee_verified_at?: string | null
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
      phone_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone_number: string
          user_id: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_number: string
          user_id: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_number?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string
          full_name: string
          id: string
          is_blocked: boolean
          phone_number: string | null
          phone_verified_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_blocked?: boolean
          phone_number?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          phone_number?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
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
      user_wallets: {
        Row: {
          balance_usd: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_usd?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_usd?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          access_request_id: string | null
          amount_usd: number
          created_at: string
          deal_id: string | null
          direction: string
          external_reference: string | null
          id: string
          metadata: Json
          provider: string
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          access_request_id?: string | null
          amount_usd: number
          created_at?: string
          deal_id?: string | null
          direction?: string
          external_reference?: string | null
          id?: string
          metadata?: Json
          provider?: string
          status?: string
          transaction_type?: string
          user_id: string
        }
        Update: {
          access_request_id?: string | null
          amount_usd?: number
          created_at?: string
          deal_id?: string | null
          direction?: string
          external_reference?: string | null
          id?: string
          metadata?: Json
          provider?: string
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_block_user: {
        Args: { _reason: string; _target_user: string }
        Returns: undefined
      }
      admin_grant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user: string
        }
        Returns: undefined
      }
      admin_unblock_user: { Args: { _target_user: string }; Returns: undefined }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      ensure_user_wallet: { Args: { _user_id: string }; Returns: string }
      get_admin_stats: { Args: never; Returns: Json }
      get_idea_analytics: { Args: { _idea_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_idea_views: { Args: { _idea_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "entrepreneur" | "investor" | "explorer" | "admin"
      deal_status:
        | "draft"
        | "pending_founder"
        | "pending_investor"
        | "negotiating"
        | "signed"
        | "completed"
        | "cancelled"
      idea_listing_type: "sell_only" | "sell_and_execute" | "partnership"
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
      app_role: ["entrepreneur", "investor", "explorer", "admin"],
      deal_status: [
        "draft",
        "pending_founder",
        "pending_investor",
        "negotiating",
        "signed",
        "completed",
        "cancelled",
      ],
      idea_listing_type: ["sell_only", "sell_and_execute", "partnership"],
      kyc_status: ["not_started", "pending", "approved", "rejected"],
    },
  },
} as const
