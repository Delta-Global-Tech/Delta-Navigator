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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      aberturas_contas: {
        Row: {
          canal: string | null
          created_at: string | null
          data_formalizacao: string
          id: string
          matricula: string | null
          segmento: string | null
          tipo_documento: string | null
        }
        Insert: {
          canal?: string | null
          created_at?: string | null
          data_formalizacao: string
          id?: string
          matricula?: string | null
          segmento?: string | null
          tipo_documento?: string | null
        }
        Update: {
          canal?: string | null
          created_at?: string | null
          data_formalizacao?: string
          id?: string
          matricula?: string | null
          segmento?: string | null
          tipo_documento?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          banco: string | null
          comissao_prevista: number | null
          comissao_recebida: number | null
          consultor: string | null
          created_at: string | null
          data_cadastro: string | null
          data_pago: string | null
          external_id: string
          id: number
          saldo_devedor: number | null
          status: Database["public"]["Enums"]["contract_status"] | null
          updated_at: string | null
        }
        Insert: {
          banco?: string | null
          comissao_prevista?: number | null
          comissao_recebida?: number | null
          consultor?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          data_pago?: string | null
          external_id: string
          id?: number
          saldo_devedor?: number | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
        }
        Update: {
          banco?: string | null
          comissao_prevista?: number | null
          comissao_recebida?: number | null
          consultor?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          data_pago?: string | null
          external_id?: string
          id?: number
          saldo_devedor?: number | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      operacoes: {
        Row: {
          created_at: string | null
          data_emissao: string | null
          id: string
          matricula: string | null
          prazo: number | null
          saldo_devedor: number | null
          status: string | null
          tipo_documento: string
          tipo_liberacao: string
          valor_parcela: number | null
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string | null
          id?: string
          matricula?: string | null
          prazo?: number | null
          saldo_devedor?: number | null
          status?: string | null
          tipo_documento: string
          tipo_liberacao: string
          valor_parcela?: number | null
        }
        Update: {
          created_at?: string | null
          data_emissao?: string | null
          id?: string
          matricula?: string | null
          prazo?: number | null
          saldo_devedor?: number | null
          status?: string | null
          tipo_documento?: string
          tipo_liberacao?: string
          valor_parcela?: number | null
        }
        Relationships: []
      }
      producao_fila_compra: {
        Row: {
          created_at: string | null
          data_atualizacao_off: string | null
          data_atualizacao_on: string | null
          data_formalizacao: string | null
          id: string
          matricula: string | null
          prazo: number | null
          status: string | null
          tipo_documento: string | null
          tipo_liberacao: string | null
          valor_parcela: number | null
        }
        Insert: {
          created_at?: string | null
          data_atualizacao_off?: string | null
          data_atualizacao_on?: string | null
          data_formalizacao?: string | null
          id?: string
          matricula?: string | null
          prazo?: number | null
          status?: string | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Update: {
          created_at?: string | null
          data_atualizacao_off?: string | null
          data_atualizacao_on?: string | null
          data_formalizacao?: string | null
          id?: string
          matricula?: string | null
          prazo?: number | null
          status?: string | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
      producao_fila_novo: {
        Row: {
          created_at: string | null
          data_atualizacao_off: string | null
          data_atualizacao_on: string | null
          data_formalizacao: string | null
          id: string
          matricula: string | null
          prazo: number | null
          status: string | null
          tipo_documento: string | null
          tipo_liberacao: string | null
          valor_parcela: number | null
        }
        Insert: {
          created_at?: string | null
          data_atualizacao_off?: string | null
          data_atualizacao_on?: string | null
          data_formalizacao?: string | null
          id?: string
          matricula?: string | null
          prazo?: number | null
          status?: string | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Update: {
          created_at?: string | null
          data_atualizacao_off?: string | null
          data_atualizacao_on?: string | null
          data_formalizacao?: string | null
          id?: string
          matricula?: string | null
          prazo?: number | null
          status?: string | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
      producao_paga_compra: {
        Row: {
          comissao: number | null
          created_at: string | null
          data_ddb: string | null
          data_formalizacao: string
          id: string
          matricula: string | null
          prazo: number | null
          tipo_documento: string | null
          tipo_liberacao: string | null
          valor_parcela: number | null
        }
        Insert: {
          comissao?: number | null
          created_at?: string | null
          data_ddb?: string | null
          data_formalizacao: string
          id?: string
          matricula?: string | null
          prazo?: number | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Update: {
          comissao?: number | null
          created_at?: string | null
          data_ddb?: string | null
          data_formalizacao?: string
          id?: string
          matricula?: string | null
          prazo?: number | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
      producao_paga_novo: {
        Row: {
          comissao: number | null
          created_at: string | null
          data_ddb: string | null
          data_formalizacao: string
          id: string
          matricula: string | null
          prazo: number | null
          tipo_documento: string | null
          tipo_liberacao: string | null
          valor_parcela: number | null
        }
        Insert: {
          comissao?: number | null
          created_at?: string | null
          data_ddb?: string | null
          data_formalizacao: string
          id?: string
          matricula?: string | null
          prazo?: number | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Update: {
          comissao?: number | null
          created_at?: string | null
          data_ddb?: string | null
          data_formalizacao?: string
          id?: string
          matricula?: string | null
          prazo?: number | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
      producao_total_compra: {
        Row: {
          created_at: string | null
          data_formalizacao: string
          id: string
          matricula: string | null
          prazo: number | null
          tipo_documento: string | null
          tipo_liberacao: string | null
          valor_parcela: number | null
        }
        Insert: {
          created_at?: string | null
          data_formalizacao: string
          id?: string
          matricula?: string | null
          prazo?: number | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Update: {
          created_at?: string | null
          data_formalizacao?: string
          id?: string
          matricula?: string | null
          prazo?: number | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
      producao_total_novo: {
        Row: {
          created_at: string | null
          data_formalizacao: string
          id: string
          matricula: string | null
          prazo: number | null
          tipo_documento: string | null
          tipo_liberacao: string | null
          valor_parcela: number | null
        }
        Insert: {
          created_at?: string | null
          data_formalizacao: string
          id?: string
          matricula?: string | null
          prazo?: number | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Update: {
          created_at?: string | null
          data_formalizacao?: string
          id?: string
          matricula?: string | null
          prazo?: number | null
          tipo_documento?: string | null
          tipo_liberacao?: string | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      contracts_dashboard_summary: {
        Row: {
          total_comissao_prevista: number | null
          total_comissao_recebida: number | null
          total_registros: number | null
          total_saldo_devedor: number | null
          ultima_sync: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contract_status: "Cadastrado" | "Averbado" | "Pago" | "Cancelado"
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
      contract_status: ["Cadastrado", "Averbado", "Pago", "Cancelado"],
    },
  },
} as const
