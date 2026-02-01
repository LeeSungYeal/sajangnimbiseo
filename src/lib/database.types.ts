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
        PostgrestVersion: "14.1",
        Tables: never,
        Views: never,
        Functions: never,
        Enums: never,
        CompositeTypes: never,
    }
    public: {
        Tables: {
            coupon_stats: {
                Row: {
                    coupon_name: string
                    download_count: number | null
                    id: number
                    status: boolean | null
                    store_id: number | null
                    updated_at: string | null
                    used_count: number | null
                }
                Insert: {
                    coupon_name: string
                    download_count?: number | null
                    id?: number
                    status?: boolean | null
                    store_id?: number | null
                    updated_at?: string | null
                    used_count?: number | null
                }
                Update: {
                    coupon_name?: string
                    download_count?: number | null
                    id?: number
                    status?: boolean | null
                    store_id?: number | null
                    updated_at?: string | null
                    used_count?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "coupon_stats_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    },
                ]
            }
            daily_metrics: {
                Row: {
                    booking_count: number | null
                    call_count: number | null
                    created_at: string | null
                    date: string
                    id: string
                    payment_amount: number | null
                    store_id: number | null
                    top_keywords: string[] | null
                    visitor_count: number | null
                }
                Insert: {
                    booking_count?: number | null
                    call_count?: number | null
                    created_at?: string | null
                    date: string
                    id?: string
                    payment_amount?: number | null
                    store_id?: number | null
                    top_keywords?: string[] | null
                    visitor_count?: number | null
                }
                Update: {
                    booking_count?: number | null
                    call_count?: number | null
                    created_at?: string | null
                    date?: string
                    id?: string
                    payment_amount?: number | null
                    store_id?: number | null
                    top_keywords?: string[] | null
                    visitor_count?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_metrics_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "store_management"
                        referencedColumns: ["id"]
                    },
                ]
            }
            documents: {
                Row: {
                    content: string | null
                    created_at: string | null
                    embedding: string | null
                    id: number
                    metadata: Json | null
                    title: string | null
                }
                Insert: {
                    content?: string | null
                    created_at?: string | null
                    embedding?: string | null
                    id?: number
                    metadata?: Json | null
                    title?: string | null
                }
                Update: {
                    content?: string | null
                    created_at?: string | null
                    embedding?: string | null
                    id?: number
                    metadata?: Json | null
                    title?: string | null
                }
                Relationships: []
            }
            family_messages: {
                Row: {
                    author: string
                    content: string
                    created_at: string | null
                    emoji: string | null
                    id: string
                }
                Insert: {
                    author: string
                    content: string
                    created_at?: string | null
                    emoji?: string | null
                    id?: string
                }
                Update: {
                    author?: string
                    content?: string
                    created_at?: string | null
                    emoji?: string | null
                    id?: string
                }
                Relationships: []
            }
            review: {
                Row: {
                    content: string
                    created_at: string
                    id: number
                }
                Insert: {
                    content: string
                    created_at?: string
                    id?: number
                }
                Update: {
                    content?: string
                    created_at?: string
                    id?: number
                }
                Relationships: []
            }
            store_management: {
                Row: {
                    booking_id: number | null
                    business_id: number | null
                    created_at: string | null
                    email: string | null
                    id: number
                    is_report_enabled: boolean | null
                    manager_name: string | null
                    naver_id: string | null
                    naver_pw: string | null
                    phone_number: string | null
                    store_name: string
                    store_url: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    booking_id?: number | null
                    business_id?: number | null
                    created_at?: string | null
                    email?: string | null
                    id?: number
                    is_report_enabled?: boolean | null
                    manager_name?: string | null
                    naver_id?: string | null
                    naver_pw?: string | null
                    phone_number?: string | null
                    store_name: string
                    store_url?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    booking_id?: number | null
                    business_id?: number | null
                    created_at?: string | null
                    email?: string | null
                    id?: number
                    is_report_enabled?: boolean | null
                    manager_name?: string | null
                    naver_id?: string | null
                    naver_pw?: string | null
                    phone_number?: string | null
                    store_name?: string
                    store_url?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            url_analysis_results: {
                Row: {
                    content_summary: string | null
                    created_at: string | null
                    id: string
                    news_content: string | null
                    raw_data: string | null
                    target_url: string
                    title: string | null
                }
                Insert: {
                    content_summary?: string | null
                    created_at?: string | null
                    id?: string
                    news_content?: string | null
                    raw_data?: string | null
                    target_url: string
                    title?: string | null
                }
                Update: {
                    content_summary?: string | null
                    created_at?: string | null
                    id?: string
                    news_content?: string | null
                    raw_data?: string | null
                    target_url?: string
                    title?: string | null
                }
                Relationships: []
            }
            weekly_reports: {
                Row: {
                    created_at: string | null
                    id: number
                    report_data: Json | null
                    store_id: number | null
                }
                Insert: {
                    created_at?: string | null
                    id?: number
                    report_data?: Json | null
                    store_id?: number | null
                }
                Update: {
                    created_at?: string | null
                    id?: number
                    report_data?: Json | null
                    store_id?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "weekly_reports_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "store_management"
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
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
