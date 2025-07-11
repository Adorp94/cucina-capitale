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
      accesorios: {
        Row: {
          accesorios: string | null
          categoria: string | null
          comentario: string | null
          costo: number | null
          gf: string | null
          id_accesorios: number
          link: string | null
          proveedor: string | null
          subcategoria: string | null
        }
        Insert: {
          accesorios?: string | null
          categoria?: string | null
          comentario?: string | null
          costo?: number | null
          gf?: string | null
          id_accesorios?: number
          link?: string | null
          proveedor?: string | null
          subcategoria?: string | null
        }
        Update: {
          accesorios?: string | null
          categoria?: string | null
          comentario?: string | null
          costo?: number | null
          gf?: string | null
          id_accesorios?: number
          link?: string | null
          proveedor?: string | null
          subcategoria?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          celular: string | null
          correo: string | null
          created_at: string
          direccion: string | null
          id_cliente: number
          nombre: string | null
        }
        Insert: {
          celular?: string | null
          correo?: string | null
          created_at?: string
          direccion?: string | null
          id_cliente?: number
          nombre?: string | null
        }
        Update: {
          celular?: string | null
          correo?: string | null
          created_at?: string
          direccion?: string | null
          id_cliente?: number
          nombre?: string | null
        }
        Relationships: []
      }
      cotizacion_items: {
        Row: {
          description: string
          id_cotizacion: number
          id_item: number
          insumo_id: number | null
          position: number
          quantity: number
          t_tl: number | null
          tip_on_largo: number | null
          total_price: number
          u_tl: number | null
          unit_price: number
        }
        Insert: {
          description: string
          id_cotizacion: number
          id_item?: number
          insumo_id?: number | null
          position: number
          quantity: number
          t_tl?: number | null
          tip_on_largo?: number | null
          total_price: number
          u_tl?: number | null
          unit_price: number
        }
        Update: {
          description?: string
          id_cotizacion?: number
          id_item?: number
          insumo_id?: number | null
          position?: number
          quantity?: number
          t_tl?: number | null
          tip_on_largo?: number | null
          total_price?: number
          u_tl?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_id_cotizacion_fkey"
            columns: ["id_cotizacion"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id_cotizacion"]
          },
          {
            foreignKeyName: "cotizacion_items_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["insumo_id"]
          },
        ]
      }
      cotizacion_materiales: {
        Row: {
          costo_usado: number
          id_cotizacion: number
          id_material: number
          tipo: string
        }
        Insert: {
          costo_usado: number
          id_cotizacion: number
          id_material: number
          tipo: string
        }
        Update: {
          costo_usado?: number
          id_cotizacion?: number
          id_material?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_materiales_id_cotizacion_fkey"
            columns: ["id_cotizacion"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id_cotizacion"]
          },
          {
            foreignKeyName: "cotizacion_materiales_id_material_fkey"
            columns: ["id_material"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id_material"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          created_at: string
          delivery_time: string | null
          id_cliente: number
          id_cotizacion: number
          notes: string | null
          project_name: string | null
          project_type: string
          status: string
          subtotal: number
          tax_rate: number
          taxes: number
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          delivery_time?: string | null
          id_cliente: number
          id_cotizacion?: number
          notes?: string | null
          project_name?: string | null
          project_type: string
          status?: string
          subtotal: number
          tax_rate: number
          taxes: number
          total: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          delivery_time?: string | null
          id_cliente?: number
          id_cotizacion?: number
          notes?: string | null
          project_name?: string | null
          project_type?: string
          status?: string
          subtotal?: number
          tax_rate?: number
          taxes?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_cliente"]
          },
        ]
      }
      insumos: {
        Row: {
          bisagras: number | null
          cajones: number | null
          categoria: string | null
          chap_huacal: number | null
          chap_vista: number | null
          cif: number | null
          clip_patas: number | null
          corredera: number | null
          descripcion: string | null
          empaque: string | null
          entrepaños: number | null
          insumo_id: number
          jaladera: number | null
          kit_tornillo: number | null
          mat_huacal: number | null
          mat_vista: number | null
          mensulas: number | null
          mueble: string | null
          patas: number | null
          puertas: number | null
          t_tl: number | null
          tipo: string | null
          tipo_mueble: string | null
          tipon_largo: number | null
          u_tl: number | null
        }
        Insert: {
          bisagras?: number | null
          cajones?: number | null
          categoria?: string | null
          chap_huacal?: number | null
          chap_vista?: number | null
          cif?: number | null
          clip_patas?: number | null
          corredera?: number | null
          descripcion?: string | null
          empaque?: string | null
          entrepaños?: number | null
          insumo_id?: number
          jaladera?: number | null
          kit_tornillo?: number | null
          mat_huacal?: number | null
          mat_vista?: number | null
          mensulas?: number | null
          mueble?: string | null
          patas?: number | null
          puertas?: number | null
          t_tl?: number | null
          tipo?: string | null
          tipo_mueble?: string | null
          tipon_largo?: number | null
          u_tl?: number | null
        }
        Update: {
          bisagras?: number | null
          cajones?: number | null
          categoria?: string | null
          chap_huacal?: number | null
          chap_vista?: number | null
          cif?: number | null
          clip_patas?: number | null
          corredera?: number | null
          descripcion?: string | null
          empaque?: string | null
          entrepaños?: number | null
          insumo_id?: number
          jaladera?: number | null
          kit_tornillo?: number | null
          mat_huacal?: number | null
          mat_vista?: number | null
          mensulas?: number | null
          mueble?: string | null
          patas?: number | null
          puertas?: number | null
          t_tl?: number | null
          tipo?: string | null
          tipo_mueble?: string | null
          tipon_largo?: number | null
          u_tl?: number | null
        }
        Relationships: []
      }
      materiales: {
        Row: {
          categoria: string | null
          comentario: string | null
          costo: number | null
          id_material: number
          nombre: string | null
          subcategoria: string | null
          tipo: string | null
        }
        Insert: {
          categoria?: string | null
          comentario?: string | null
          costo?: number | null
          id_material: number
          nombre?: string | null
          subcategoria?: string | null
          tipo?: string | null
        }
        Update: {
          categoria?: string | null
          comentario?: string | null
          costo?: number | null
          id_material?: number
          nombre?: string | null
          subcategoria?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_furniture_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          tipo: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    ? keyof Database[DefaultSchemaCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const