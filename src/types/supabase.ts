export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          children_ids: string[] | null
          created_at: string | null
          divorce_date: string | null
          divorce_place: string | null
          id: string
          marriage_date: string | null
          marriage_place: string | null
          spouse1_id: string | null
          spouse2_id: string | null
        }
        Insert: {
          children_ids?: string[] | null
          created_at?: string | null
          divorce_date?: string | null
          divorce_place?: string | null
          id?: string
          marriage_date?: string | null
          marriage_place?: string | null
          spouse1_id?: string | null
          spouse2_id?: string | null
        }
        Update: {
          children_ids?: string[] | null
          created_at?: string | null
          divorce_date?: string | null
          divorce_place?: string | null
          id?: string
          marriage_date?: string | null
          marriage_place?: string | null
          spouse1_id?: string | null
          spouse2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_spouse1_id_fkey"
            columns: ["spouse1_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_spouse2_id_fkey"
            columns: ["spouse2_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["id"]
          },
        ]
      }
      guestbook_entries: {
        Row: {
          created_at: string | null
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      individuals: {
        Row: {
          birth_date: string | null
          birth_place: string | null
          child_in_family_id: string | null
          created_at: string | null
          death_date: string | null
          death_place: string | null
          description: string | null
          education: Json | null
          gender: Database["public"]["Enums"]["gender_enum"]
          id: string
          name: string
          notes: string | null
          photo_url: string | null
          profession: string | null
          related_references: Json | null
          sources: Json | null
          works: Json | null
        }
        Insert: {
          birth_date?: string | null
          birth_place?: string | null
          child_in_family_id?: string | null
          created_at?: string | null
          death_date?: string | null
          death_place?: string | null
          description?: string | null
          education?: Json | null
          gender: Database["public"]["Enums"]["gender_enum"]
          id?: string
          name: string
          notes?: string | null
          photo_url?: string | null
          profession?: string | null
          related_references?: Json | null
          sources?: Json | null
          works?: Json | null
        }
        Update: {
          birth_date?: string | null
          birth_place?: string | null
          child_in_family_id?: string | null
          created_at?: string | null
          death_date?: string | null
          death_place?: string | null
          description?: string | null
          education?: Json | null
          gender?: Database["public"]["Enums"]["gender_enum"]
          id?: string
          name?: string
          notes?: string | null
          photo_url?: string | null
          profession?: string | null
          related_references?: Json | null
          sources?: Json | null
          works?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_child_in_family"
            columns: ["child_in_family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gender_enum: "male" | "female" | "unknown"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      gender_enum: ["male", "female", "unknown"],
    },
  },
} as const
