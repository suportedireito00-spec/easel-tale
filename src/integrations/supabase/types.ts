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
      article_time_reminders: {
        Row: {
          active: boolean
          artigo_ref: string
          channel: string
          created_at: string
          days_of_week: number[]
          id: string
          label: string | null
          message: string | null
          time_of_day: string
          triggered_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          artigo_ref: string
          channel?: string
          created_at?: string
          days_of_week?: number[]
          id?: string
          label?: string | null
          message?: string | null
          time_of_day?: string
          triggered_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          artigo_ref?: string
          channel?: string
          created_at?: string
          days_of_week?: number[]
          id?: string
          label?: string | null
          message?: string | null
          time_of_day?: string
          triggered_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artigo_ai_cache: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          numero_artigo: string
          payload: Json
          tabela_codigo: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          numero_artigo: string
          payload?: Json
          tabela_codigo: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          numero_artigo?: string
          payload?: Json
          tabela_codigo?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      artigos_anotacoes: {
        Row: {
          anotacao: string | null
          artigo_id: string | null
          audio_duration_ms: number | null
          audio_url: string | null
          created_at: string
          id: string
          numero_artigo: string
          tabela_codigo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anotacao?: string | null
          artigo_id?: string | null
          audio_duration_ms?: number | null
          audio_url?: string | null
          created_at?: string
          id?: string
          numero_artigo: string
          tabela_codigo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anotacao?: string | null
          artigo_id?: string | null
          audio_duration_ms?: number | null
          audio_url?: string | null
          created_at?: string
          id?: string
          numero_artigo?: string
          tabela_codigo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artigos_grifos: {
        Row: {
          artigo_id: string | null
          created_at: string
          highlights: Json
          id: string
          numero_artigo: string
          tabela_codigo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artigo_id?: string | null
          created_at?: string
          highlights?: Json
          id?: string
          numero_artigo: string
          tabela_codigo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artigo_id?: string | null
          created_at?: string
          highlights?: Json
          id?: string
          numero_artigo?: string
          tabela_codigo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      board_items: {
        Row: {
          board_id: string
          created_at: string
          height: number
          id: string
          image_url: string | null
          metadata: Json | null
          notes: string | null
          rotation: number
          source_url: string | null
          tags: string[] | null
          type: string
          user_id: string | null
          width: number
          x: number
          y: number
          z_index: number
        }
        Insert: {
          board_id: string
          created_at?: string
          height?: number
          id?: string
          image_url?: string | null
          metadata?: Json | null
          notes?: string | null
          rotation?: number
          source_url?: string | null
          tags?: string[] | null
          type?: string
          user_id?: string | null
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          board_id?: string
          created_at?: string
          height?: number
          id?: string
          image_url?: string | null
          metadata?: Json | null
          notes?: string | null
          rotation?: number
          source_url?: string | null
          tags?: string[] | null
          type?: string
          user_id?: string | null
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      dicionario_juridico: {
        Row: {
          created_at: string
          exemplo_pratico: string | null
          id: string
          letra: string
          palavra: string
          significado: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exemplo_pratico?: string | null
          id?: string
          letra: string
          palavra: string
          significado: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exemplo_pratico?: string | null
          id?: string
          letra?: string
          palavra?: string
          significado?: string
          updated_at?: string
        }
        Relationships: []
      }
      informativos_stf: {
        Row: {
          created_at: string
          data_publicacao: string | null
          destaque: string | null
          edicao: number
          edicao_titulo: string | null
          id: string
          informacoes_adicionais: string | null
          inteiro_teor: string | null
          ordem: number
          processo: string | null
          ramo_direito: string | null
          raw: string | null
          secao: string | null
          tema: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string | null
          destaque?: string | null
          edicao: number
          edicao_titulo?: string | null
          id?: string
          informacoes_adicionais?: string | null
          inteiro_teor?: string | null
          ordem: number
          processo?: string | null
          ramo_direito?: string | null
          raw?: string | null
          secao?: string | null
          tema?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string | null
          destaque?: string | null
          edicao?: number
          edicao_titulo?: string | null
          id?: string
          informacoes_adicionais?: string | null
          inteiro_teor?: string | null
          ordem?: number
          processo?: string | null
          ramo_direito?: string | null
          raw?: string | null
          secao?: string | null
          tema?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      informativos_stj: {
        Row: {
          created_at: string
          data_publicacao: string | null
          destaque: string | null
          edicao: number
          edicao_titulo: string | null
          id: string
          informacoes_adicionais: string | null
          inteiro_teor: string | null
          ordem: number
          processo: string | null
          ramo_direito: string | null
          raw: string | null
          secao: string | null
          tema: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string | null
          destaque?: string | null
          edicao: number
          edicao_titulo?: string | null
          id?: string
          informacoes_adicionais?: string | null
          inteiro_teor?: string | null
          ordem: number
          processo?: string | null
          ramo_direito?: string | null
          raw?: string | null
          secao?: string | null
          tema?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string | null
          destaque?: string | null
          edicao?: number
          edicao_titulo?: string | null
          id?: string
          informacoes_adicionais?: string | null
          inteiro_teor?: string | null
          ordem?: number
          processo?: string | null
          ramo_direito?: string | null
          raw?: string | null
          secao?: string | null
          tema?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      jurisprudencia_prontas: {
        Row: {
          assunto: string | null
          created_at: string
          id: string
          ordem: number
          query_string: string | null
          query_url: string
          ramo: string
          slug: string
          titulo: string
          tribunal: string
          updated_at: string
        }
        Insert: {
          assunto?: string | null
          created_at?: string
          id?: string
          ordem?: number
          query_string?: string | null
          query_url: string
          ramo: string
          slug: string
          titulo: string
          tribunal: string
          updated_at?: string
        }
        Update: {
          assunto?: string | null
          created_at?: string
          id?: string
          ordem?: number
          query_string?: string | null
          query_url?: string
          ramo?: string
          slug?: string
          titulo?: string
          tribunal?: string
          updated_at?: string
        }
        Relationships: []
      }
      jurisprudencia_prontas_resultados: {
        Row: {
          created_at: string
          data_julgamento: string | null
          data_publicacao: string | null
          ementa: string | null
          ementa_refinada: string | null
          fetched_at: string
          id: string
          observacao: string | null
          observacao_refinada: string | null
          ordem: number
          orgao: string | null
          pesquisa_id: string
          raw: Json | null
          refinado_em: string | null
          relator: string | null
          titulo: string
          url_inteiro_teor: string | null
          url_pdf: string | null
        }
        Insert: {
          created_at?: string
          data_julgamento?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          ementa_refinada?: string | null
          fetched_at?: string
          id?: string
          observacao?: string | null
          observacao_refinada?: string | null
          ordem?: number
          orgao?: string | null
          pesquisa_id: string
          raw?: Json | null
          refinado_em?: string | null
          relator?: string | null
          titulo: string
          url_inteiro_teor?: string | null
          url_pdf?: string | null
        }
        Update: {
          created_at?: string
          data_julgamento?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          ementa_refinada?: string | null
          fetched_at?: string
          id?: string
          observacao?: string | null
          observacao_refinada?: string | null
          ordem?: number
          orgao?: string | null
          pesquisa_id?: string
          raw?: Json | null
          refinado_em?: string | null
          relator?: string | null
          titulo?: string
          url_inteiro_teor?: string | null
          url_pdf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisprudencia_prontas_resultados_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "jurisprudencia_prontas"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisprudencia_teses_edicoes: {
        Row: {
          created_at: string
          data_publicacao: string | null
          edicao: number
          id: string
          ramo: string | null
          titulo: string
          total_teses: number
          tribunal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string | null
          edicao: number
          id?: string
          ramo?: string | null
          titulo: string
          total_teses?: number
          tribunal?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string | null
          edicao?: number
          id?: string
          ramo?: string | null
          titulo?: string
          total_teses?: number
          tribunal?: string
          updated_at?: string
        }
        Relationships: []
      }
      jurisprudencia_teses_itens: {
        Row: {
          created_at: string
          edicao: number
          edicao_id: string
          id: string
          julgados: string | null
          numero: number
          tese: string
          tribunal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edicao: number
          edicao_id: string
          id?: string
          julgados?: string | null
          numero: number
          tese: string
          tribunal?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edicao?: number
          edicao_id?: string
          id?: string
          julgados?: string | null
          numero?: number
          tese?: string
          tribunal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisprudencia_teses_itens_edicao_id_fkey"
            columns: ["edicao_id"]
            isOneToOne: false
            referencedRelation: "jurisprudencia_teses_edicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      location_reminders: {
        Row: {
          active: boolean
          address: string | null
          artigo_ref: string
          channel: string
          created_at: string
          id: string
          label: string | null
          lat: number | null
          lng: number | null
          message: string | null
          radius_m: number
          triggered_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          artigo_ref: string
          channel?: string
          created_at?: string
          id?: string
          label?: string | null
          lat?: number | null
          lng?: number | null
          message?: string | null
          radius_m?: number
          triggered_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          address?: string | null
          artigo_ref?: string
          channel?: string
          created_at?: string
          id?: string
          label?: string | null
          lat?: number | null
          lng?: number | null
          message?: string | null
          radius_m?: number
          triggered_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sumulas_favoritos: {
        Row: {
          created_at: string
          sumula_numero: number
          tribunal: string
          user_id: string
        }
        Insert: {
          created_at?: string
          sumula_numero: number
          tribunal: string
          user_id: string
        }
        Update: {
          created_at?: string
          sumula_numero?: number
          tribunal?: string
          user_id?: string
        }
        Relationships: []
      }
      sumulas_stf: {
        Row: {
          created_at: string
          data_aprovacao: string | null
          enunciado: string
          fonte_publicacao: string | null
          numero: number
          observacao: string | null
          orgao_julgador: string | null
          ramo_direito: string | null
          situacao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_aprovacao?: string | null
          enunciado: string
          fonte_publicacao?: string | null
          numero: number
          observacao?: string | null
          orgao_julgador?: string | null
          ramo_direito?: string | null
          situacao?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_aprovacao?: string | null
          enunciado?: string
          fonte_publicacao?: string | null
          numero?: number
          observacao?: string | null
          orgao_julgador?: string | null
          ramo_direito?: string | null
          situacao?: string
          updated_at?: string
        }
        Relationships: []
      }
      sumulas_stj: {
        Row: {
          created_at: string
          data_publicacao: string | null
          enunciado: string
          numero: number
          observacao: string | null
          orgao_julgador: string | null
          situacao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string | null
          enunciado: string
          numero: number
          observacao?: string | null
          orgao_julgador?: string | null
          situacao?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string | null
          enunciado?: string
          numero?: number
          observacao?: string | null
          orgao_julgador?: string | null
          situacao?: string
          updated_at?: string
        }
        Relationships: []
      }
      sumulas_vinculantes: {
        Row: {
          created_at: string
          data_publicacao: string | null
          enunciado: string
          extras: Json
          numero: number
          referencia: string | null
          situacao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string | null
          enunciado?: string
          extras?: Json
          numero: number
          referencia?: string | null
          situacao?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string | null
          enunciado?: string
          extras?: Json
          numero?: number
          referencia?: string | null
          situacao?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          highlights: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highlights?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          highlights?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
