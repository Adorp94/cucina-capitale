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
      users: {
        Row: {
          id: string
          full_name: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          rfc: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          rfc?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          rfc?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          unit: string | null
          base_price: number
          category: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          unit?: string | null
          base_price: number
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          unit?: string | null
          base_price?: number
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quotations: {
        Row: {
          id: string
          client_id: string | null
          number: string
          title: string
          description: string | null
          status: string
          subtotal: number
          taxes: number
          total: number
          valid_until: string | null
          terms: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          client_id?: string | null
          number: string
          title: string
          description?: string | null
          status?: string
          subtotal: number
          taxes: number
          total: number
          valid_until?: string | null
          terms?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          client_id?: string | null
          number?: string
          title?: string
          description?: string | null
          status?: string
          subtotal?: number
          taxes?: number
          total?: number
          valid_until?: string | null
          terms?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quotation_items: {
        Row: {
          id: string
          quotation_id: string
          product_id: string | null
          description: string
          quantity: number
          unit_price: number
          discount: number
          subtotal: number
          notes: string | null
          position: number
        }
        Insert: {
          id?: string
          quotation_id: string
          product_id?: string | null
          description: string
          quantity: number
          unit_price: number
          discount?: number
          subtotal: number
          notes?: string | null
          position: number
        }
        Update: {
          id?: string
          quotation_id?: string
          product_id?: string | null
          description?: string
          quantity?: number
          unit_price?: number
          discount?: number
          subtotal?: number
          notes?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      inventario: {
        Row: {
          mueble_id: number
          nombre_mueble: string | null
          cajones: number | null
          puertas: number | null
          entrepaños: number | null
          cif: number | null
          created_at: string | null
          updated_at: string | null
          precio: number | null
          descripcion: string | null
          dimensiones: string | null
          color: string | null
          estilo: string | null
          imagen_url: string | null
          estado: string | null
        }
        Insert: {
          mueble_id?: number
          nombre_mueble?: string | null
          cajones?: number | null
          puertas?: number | null
          entrepaños?: number | null
          cif?: number | null
          created_at?: string | null
          updated_at?: string | null
          precio?: number | null
          descripcion?: string | null
          dimensiones?: string | null
          color?: string | null
          estilo?: string | null
          imagen_url?: string | null
          estado?: string | null
        }
        Update: {
          mueble_id?: number
          nombre_mueble?: string | null
          cajones?: number | null
          puertas?: number | null
          entrepaños?: number | null
          cif?: number | null
          created_at?: string | null
          updated_at?: string | null
          precio?: number | null
          descripcion?: string | null
          dimensiones?: string | null
          color?: string | null
          estilo?: string | null
          imagen_url?: string | null
          estado?: string | null
        }
        Relationships: []
      }
      materiales: {
        Row: {
          id_material: number
          nombre: string | null
          tipo: string | null
          categoria: string | null
          costo: number | null
          comentario: string | null
          created_at: string | null
          updated_at: string | null
          unidad_medida: string | null
          stock: number | null
          proveedor: string | null
          imagen_url: string | null
        }
        Insert: {
          id_material?: number
          nombre?: string | null
          tipo?: string | null
          categoria?: string | null
          costo?: number | null
          comentario?: string | null
          created_at?: string | null
          updated_at?: string | null
          unidad_medida?: string | null
          stock?: number | null
          proveedor?: string | null
          imagen_url?: string | null
        }
        Update: {
          id_material?: number
          nombre?: string | null
          tipo?: string | null
          categoria?: string | null
          costo?: number | null
          comentario?: string | null
          created_at?: string | null
          updated_at?: string | null
          unidad_medida?: string | null
          stock?: number | null
          proveedor?: string | null
          imagen_url?: string | null
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