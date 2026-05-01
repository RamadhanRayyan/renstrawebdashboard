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
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          is_approved: boolean | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_approved?: boolean | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          role?: string | null
        }
        Relationships: []
      }
      renstra_indikator: {
        Row: {
          bagian: string | null
          baseline: number | null
          borang_aipt: string | null
          created_at: string
          id: string
          iku_ikt: string | null
          kode: string | null
          link: string | null
          nama: string
          penjelasan: string | null
          pic: string | null
          sasaran_id: string
          satuan: string
          updated_at: string
          urutan: number
        }
        Insert: {
          bagian?: string | null
          baseline?: number | null
          borang_aipt?: string | null
          created_at?: string
          id?: string
          iku_ikt?: string | null
          kode?: string | null
          link?: string | null
          nama: string
          penjelasan?: string | null
          pic?: string | null
          sasaran_id: string
          satuan?: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          bagian?: string | null
          baseline?: number | null
          borang_aipt?: string | null
          created_at?: string
          id?: string
          iku_ikt?: string | null
          kode?: string | null
          link?: string | null
          nama?: string
          penjelasan?: string | null
          pic?: string | null
          sasaran_id?: string
          satuan?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "renstra_indikator_sasaran_id_fkey"
            columns: ["sasaran_id"]
            isOneToOne: false
            referencedRelation: "renstra_sasaran"
            referencedColumns: ["id"]
          },
        ]
      }
      renstra_programs: {
        Row: {
          created_at: string
          id: string
          nama: string
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: []
      }
      renstra_sasaran: {
        Row: {
          created_at: string
          id: string
          nama: string
          program_id: string
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          program_id: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          program_id?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "renstra_sasaran_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "renstra_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      renstra_yearly_values: {
        Row: {
          actual: number
          budget: number
          bulan: number | null
          created_at: string
          id: string
          indikator_id: string
          tahun: number
          target: number
          updated_at: string
        }
        Insert: {
          actual?: number
          budget?: number
          bulan?: number | null
          created_at?: string
          id?: string
          indikator_id: string
          tahun: number
          target?: number
          updated_at?: string
        }
        Update: {
          actual?: number
          budget?: number
          bulan?: number | null
          created_at?: string
          id?: string
          indikator_id?: string
          tahun?: number
          target?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renstra_yearly_values_indikator_id_fkey"
            columns: ["indikator_id"]
            isOneToOne: false
            referencedRelation: "renstra_indikator"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
